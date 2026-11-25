import { describe, expect, it } from 'vitest'

import {
  hashPassword,
  isLegacyHash,
  shouldRehash,
  verifyPassword,
} from './password'

const ENTROPY = 'test-entropy-fixture-0123456789'

// Produced with the pre-modernization implementation (argon2@0.41.1, fixed
// ENTROPY salt, raw base64 output) for the password "12345678".
const LEGACY_HASH =
  'Y7uvtSNxcVMVkgIoRlIfZ4eksVUOTOHvimzxOGHE1+06dAYwQmsHCFYwGU2YoxcRyLeLwlfvAzO4CPdU149EQA=='

describe('password hashing', () => {
  it('verifies hashes produced by the legacy implementation', async () => {
    expect(isLegacyHash(LEGACY_HASH)).toBe(true)
    expect(await verifyPassword('12345678', LEGACY_HASH, ENTROPY)).toBe(true)
    expect(await verifyPassword('wrong-password', LEGACY_HASH, ENTROPY)).toBe(
      false,
    )
    expect(shouldRehash(LEGACY_HASH)).toBe(true)
  })

  it('rejects legacy hashes when the entropy differs', async () => {
    expect(await verifyPassword('12345678', LEGACY_HASH, 'other')).toBe(false)
  })

  it('creates salted PHC hashes that verify and are unique per call', async () => {
    const a = await hashPassword('12345678')
    const b = await hashPassword('12345678')

    expect(a.startsWith('$argon2id$')).toBe(true)
    expect(a).not.toBe(b)
    expect(await verifyPassword('12345678', a, ENTROPY)).toBe(true)
    expect(await verifyPassword('1234567', a, ENTROPY)).toBe(false)
    expect(shouldRehash(a)).toBe(false)
  })

  it('never accepts empty or foreign hashes', async () => {
    expect(await verifyPassword('x', null, ENTROPY)).toBe(false)
    expect(await verifyPassword('x', '', ENTROPY)).toBe(false)
    expect(
      await verifyPassword(
        '12345678',
        '$2b$10$Q1RabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTU',
        ENTROPY,
      ),
    ).toBe(false)
  })
})
