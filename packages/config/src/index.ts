const NODE_ENV = process.env.NODE_ENV ?? 'development'
const DATABASE_URL = process.env.DATABASE_URL ?? ''
const ENTROPY = process.env.ENTROPY ?? ''
const MAILER_HOST = process.env.MAILER_HOST ?? ''
const MAILER_USERNAME = process.env.MAILER_USERNAME ?? ''
const MAILER_PASSWORD = process.env.MAILER_PASSWORD ?? ''
const S3_ENDPOINT = process.env.S3_ENDPOINT ?? ''
const S3_BUCKET = process.env.S3_BUCKET ?? ''
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY ?? ''
const S3_SECRET_KEY = process.env.S3_SECRET_KEY ?? ''
const GOOGLE_MAP_API = process.env.GOOGLE_MAP_API ?? ''
const SLIP_VERIFY_CLIENT_SECRET = process.env.SLIP_VERIFY_CLIENT_SECRET ?? ''
const SLIP_VERIFY_CLIENT_ID = process.env.SLIP_VERIFY_CLIENT_ID ?? ''

export const env = {
  NODE_ENV,
  DATABASE_URL,
  ENTROPY,
  MAILER_HOST,
  MAILER_USERNAME,
  MAILER_PASSWORD,
  S3_ENDPOINT,
  S3_BUCKET,
  S3_ACCESS_KEY,
  S3_SECRET_KEY,
  GOOGLE_MAP_API,
  SLIP_VERIFY_CLIENT_SECRET,
  SLIP_VERIFY_CLIENT_ID,
}

export const mailerConfig = {
  transport: {
    host: MAILER_HOST,
    port: 465,
    auth: {
      user: MAILER_USERNAME,
      pass: MAILER_PASSWORD,
    },
    secure: true,
  },
}
