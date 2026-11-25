import { argon2id, hash, needsRehash, verify } from 'argon2'
import { timingSafeEqual } from 'node:crypto'

/**
 * Password hashing.
 *
 * New hashes use the standard PHC-encoded argon2id format
 * (`$argon2id$v=19$...`) with a random per-password salt.
 *
 * Older accounts were hashed with a fixed, application-wide salt (ENTROPY) and
 * stored as raw base64. Those hashes are still accepted so nobody is locked
 * out; callers should re-hash on successful login (see `isLegacyHash`).
 */

const HASH_OPTIONS = {
  type: argon2id,
  memoryCost: 2 ** 16, // 64 MiB
  timeCost: 3,
  parallelism: 4,
} as const

const LEGACY_OPTIONS = {
  version: 19,
  type: argon2id,
  hashLength: 64,
  timeCost: 12,
  parallelism: 8,
  memoryCost: 2 ** 16,
} as const

export const isLegacyHash = (storedHash: string) =>
  !storedHash.startsWith('$argon2')

export const hashPassword = (input: string) => hash(input, HASH_OPTIONS)

const legacyHash = async (input: string, entropy: string) => {
  const raw = await hash(input, {
    ...LEGACY_OPTIONS,
    raw: true,
    salt: Buffer.from(entropy, 'utf-8'),
  })

  return raw.toString('base64')
}

export const verifyPassword = async (
  input: string,
  storedHash: string | null | undefined,
  entropy: string,
) => {
  if (!storedHash) {
    return false
  }

  if (!isLegacyHash(storedHash)) {
    try {
      return await verify(storedHash, input)
    } catch {
      return false
    }
  }

  // bcrypt and other foreign formats are not supported by this service.
  if (storedHash.startsWith('$') || !entropy) {
    return false
  }

  try {
    const expected = Buffer.from(storedHash, 'utf-8')
    const actual = Buffer.from(await legacyHash(input, entropy), 'utf-8')

    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    )
  } catch {
    // e.g. ENTROPY shorter than argon2's minimum salt length
    return false
  }
}

export const shouldRehash = (storedHash: string) =>
  isLegacyHash(storedHash) || needsRehash(storedHash, HASH_OPTIONS)
