import { z } from 'zod'

// A duration like "15m", "12h" or "7d" (seconds, minutes, hours, days).
type Duration = `${number}${'s' | 'm' | 'h' | 'd'}`

// Rules for the environment variables the app needs. Checked once, at startup.
const envSchema = z.object({
  // Signs and verifies login tokens. Anyone who knows it can forge tokens,
  // so it must be long and random.
  JWT_SECRET: z.string().min(32, 'must be at least 32 characters long'),
  // How long a login token stays valid.
  JWT_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'must look like 15m, 12h or 7d')
    .default('1d')
    .transform((value) => value as Duration),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  // Only variable names and rule messages are printed, never the values.
  const { fieldErrors } = z.flattenError(result.error)
  const problems = Object.entries(fieldErrors)
    .map(([name, messages]) => `  ${name}: ${messages?.join(', ')}`)
    .join('\n')
  console.error(`Invalid environment variables:\n${problems}`)
  process.exit(1)
}

export const env = result.data
