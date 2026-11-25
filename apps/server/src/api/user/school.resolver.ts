import { env } from '@app/config'
import { TransactionClient } from '@app/db'
import { BadRequestException } from '@nestjs/common'

/**
 * Resolves the school a new user belongs to:
 *   1. an explicit, existing `schoolId`
 *   2. a `schoolName` (created if it does not exist yet)
 *   3. DEFAULT_SCHOOL_ID from the environment
 *   4. the oldest school in the database
 *
 * Replaces the previously hard-coded school id, which did not exist in a
 * fresh database and made every registration fail with a foreign-key error.
 */
export const resolveSchoolId = async (
  tx: TransactionClient,
  args: { schoolId?: string; schoolName?: string },
) => {
  if (args.schoolId) {
    const school = await tx.school.findUnique({
      where: { id: args.schoolId },
      select: { id: true },
    })
    if (!school) {
      throw new BadRequestException('School not found')
    }

    return school.id
  }

  if (args.schoolName) {
    const school = await tx.school.upsert({
      where: { name: args.schoolName },
      update: {},
      create: { name: args.schoolName },
      select: { id: true },
    })

    return school.id
  }

  if (env.DEFAULT_SCHOOL_ID) {
    const school = await tx.school.findUnique({
      where: { id: env.DEFAULT_SCHOOL_ID },
      select: { id: true },
    })
    if (school) {
      return school.id
    }
  }

  const fallback = await tx.school.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  if (!fallback) {
    throw new BadRequestException(
      'No school is configured. Run `pnpm db:seed` or provide a schoolName.',
    )
  }

  return fallback.id
}
