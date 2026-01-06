export type RegisterArgs = {
  firstName: string
  lastName: string
  email: string
  password: string
  phoneNumber?: string
  schoolName: string
}

export type LoginArgs = {
  email: string
  password: string
}

export type User = {
  id: string
  email: string
  role: 'USER' | 'ADMIN'
  firstName: string
  lastName: string
  phoneNumber: string | null
}

export type UpdateUserArgs = {
  firstName?: string
  lastName?: string
  address?: string
  phoneNumber?: string
}
export type UpdatePasswordArgs = {
  oldpassword: string
  newPassword: string
}
