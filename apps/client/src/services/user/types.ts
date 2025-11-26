export type RegisterArgs = {
  firstName: string
  lastName: string
  email: string
  password: string
  address?: string
  province?: string
  district?: string
  country?: string
  phoneNumber?: string
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
  address: string | null
  province: string
  district: string
  country: string
}

export type UpdateUserArgs = {
  firstName?: string
  lastName?: string
  address?: string
  phoneNumber?: string
  province: string
  district: string
  country: string
}
export type UpdatePasswordArgs = {
  oldpassword: string
  newPassword: string
}
