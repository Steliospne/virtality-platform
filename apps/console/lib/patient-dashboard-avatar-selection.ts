import type { Avatar } from '@virtality/db'

export type DashboardAvatar = Pick<Avatar, 'id' | 'name'> & {
  sex?: string | null
}

export function resolveAvatarSex(avatar: DashboardAvatar): string | null {
  if (avatar.sex) return avatar.sex

  const label = `${avatar.id} ${avatar.name}`.toLowerCase()
  if (/\bfemale\b/.test(label)) return 'female'
  if (/\bmale\b/.test(label)) return 'male'

  return null
}

function findDefaultAvatarByPatientSex<T extends DashboardAvatar>(
  avatars: T[],
  patientSex: string | null | undefined,
): T | null {
  if (!patientSex || patientSex === 'other') return avatars[0] ?? null

  const matching = avatars.find(
    (avatar) => resolveAvatarSex(avatar) === patientSex,
  )

  return matching ?? avatars[0] ?? null
}

export function resolveDashboardAvatar<T extends DashboardAvatar>({
  avatars,
  lastAvatarId,
  patientSex,
}: {
  avatars: T[] | undefined
  lastAvatarId: string | undefined
  patientSex: string | null | undefined
}): T | null {
  if (!avatars?.length) return null

  if (lastAvatarId) {
    const saved = avatars.find((avatar) => avatar.id === lastAvatarId)
    if (saved) return saved
  }

  return findDefaultAvatarByPatientSex(avatars, patientSex)
}
