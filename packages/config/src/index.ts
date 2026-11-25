const read = (key: string, fallback = '') =>
  process.env[key]?.trim() ?? fallback

const NODE_ENV = read('NODE_ENV', 'development') || 'development'
const isProduction = NODE_ENV === 'production'

/**
 * Shared secret used by the Discord / assignment bots when calling the
 * public bot endpoints. The legacy hard-coded value is only accepted outside
 * production so existing local setups keep working until BOT_API_SECRET is set.
 */
const LEGACY_BOT_SECRET = 'super-secret-bot-key'
const BOT_API_SECRET =
  read('BOT_API_SECRET') || (isProduction ? '' : LEGACY_BOT_SECRET)

const CORS_ORIGINS = read(
  'CORS_ORIGINS',
  'http://localhost:3000,http://127.0.0.1:3000',
)
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

export const env = {
  NODE_ENV,
  isProduction,
  PORT: Number(read('PORT', '4000')) || 4000,
  DATABASE_URL: read('DATABASE_URL'),
  ENTROPY: read('ENTROPY'),
  MAILER_HOST: read('MAILER_HOST'),
  MAILER_USERNAME: read('MAILER_USERNAME'),
  MAILER_PASSWORD: read('MAILER_PASSWORD'),
  S3_ENDPOINT: read('S3_ENDPOINT'),
  S3_BUCKET: read('S3_BUCKET'),
  S3_ACCESS_KEY: read('S3_ACCESS_KEY'),
  S3_SECRET_KEY: read('S3_SECRET_KEY'),
  GOOGLE_MAP_API: read('GOOGLE_MAP_API'),
  SLIP_VERIFY_CLIENT_SECRET: read('SLIP_VERIFY_CLIENT_SECRET'),
  SLIP_VERIFY_CLIENT_ID: read('SLIP_VERIFY_CLIENT_ID'),
  BOT_API_SECRET,
  DEFAULT_SCHOOL_ID: read('DEFAULT_SCHOOL_ID'),
  CORS_ORIGINS,
}

/** Fail fast on configuration that would otherwise break at request time. */
export const assertServerEnv = () => {
  const required: (keyof typeof env)[] = ['DATABASE_URL', 'ENTROPY']
  if (isProduction) {
    required.push('BOT_API_SECRET')
  }
  const missing = required.filter(key => !env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    )
  }
}

export const mailerConfig = {
  transport: {
    host: env.MAILER_HOST,
    port: 465,
    auth: {
      user: env.MAILER_USERNAME,
      pass: env.MAILER_PASSWORD,
    },
    secure: true,
  },
}
