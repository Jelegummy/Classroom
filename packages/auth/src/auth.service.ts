import { env } from '@app/config'
import { Injectable } from '@nestjs/common'
import { hash as argon2Hash, argon2id } from 'argon2'
import { createSigner, createVerifier } from 'fast-jwt'

type TokenPayload = {
  id: string
  sub: string
  iat: number
  exp: number
}

@Injectable()
export class AuthService {
  generateToken(id: string) {
    const signSync = createSigner({
      key: env.ENTROPY,
      expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return signSync({ id })
  }

  verifyToken(token: string): TokenPayload {
    const verifySync = createVerifier({
      key: env.ENTROPY,
      cache: true,
    })

    return verifySync(token)
  }

  async hashPassword(input: string) {
    const hash = await argon2Hash(input, {
      version: 19,
      type: argon2id,
      hashLength: 64,
      timeCost: 12,
      parallelism: 8,
      memoryCost: 2 ** 16,
      raw: true,
      salt: Buffer.from(env.ENTROPY, 'utf-8'),
    }).then(hash => hash.toString('base64'))

    return hash
  }

  async verifyPassword(input: string, storedHash: string) {
    const inputHash = await this.hashPassword(input)

    return inputHash === storedHash
  }
}
