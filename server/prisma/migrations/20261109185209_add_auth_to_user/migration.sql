-- Adds authentication fields to User.
-- Hand-edited: Prisma's generated version added "passwordHash" as NOT NULL in
-- one step, which fails on a table that already has rows.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MANAGER', 'EMPLOYEE');

-- Existing users get the default role EMPLOYEE.
ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'EMPLOYEE';

-- Step 1: add passwordHash as nullable, so existing rows are allowed.
ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT;

-- Step 2: give existing users a placeholder that can never match a password.
-- A real bcrypt hash is 60 characters starting with "$2", so bcrypt.compare
-- always returns false for this value. These users can't log in until they
-- get a real password.
UPDATE "User" SET "passwordHash" = '!no-password-set' WHERE "passwordHash" IS NULL;

-- Step 3: now every row has a value, so the column can be required.
ALTER TABLE "User" ALTER COLUMN "passwordHash" SET NOT NULL;

-- Emails are compared in lowercase from now on, so store existing ones that way.
-- (Fails on the unique index if two emails differ only by case: fix those by hand first.)
UPDATE "User" SET "email" = LOWER("email") WHERE "email" <> LOWER("email");
