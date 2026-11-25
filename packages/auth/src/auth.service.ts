import { env } from '@app/config'
import { Injectable } from '@nestjs/common'
import { createSigner, createVerifier } from 'fast-jwt'

import { hashPassword, shouldRehash, verifyPassword } from './password'

type TokenPayload = {
  id: string
  sub?: string
  iat: number
  exp: number
}

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

@Injectable()
export class AuthService {
  // Signer/verifier construction is comparatively expensive; build them once.
  private readonly sign = createSigner({
    key: env.ENTROPY,
    expiresIn: TOKEN_TTL_MS,
  })

  private readonly verify = createVerifier({
    key: env.ENTROPY,
    cache: true,
  })

  generateToken(id: string) {
    return this.sign({ id })
  }

  verifyToken(token: string): TokenPayload {
    return this.verify(token)
  }

  hashPassword(input: string) {
    return hashPassword(input)
  }

  verifyPassword(input: string, storedHash: string | null | undefined) {
    return verifyPassword(input, storedHash, env.ENTROPY)
  }

  shouldRehash(storedHash: string) {
    return shouldRehash(storedHash)
  }
}
