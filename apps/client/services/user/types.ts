export type RegisterArgs = {
  firstName: string
  lastName: string
  email: string
  password: string
  address?: string
}

export type LoginArgs = {
  email: string
  password: string
}

export type User = {
  id: string
  email: string
  role: 'TEACHER' | 'ADMIN' | 'STUDENT'
  firstName: string
  lastName: string
  phoneNumber: string | null
  address: string | null
}

export type UpdateUserArgs = {
  name?: string
  surname?: string
  address?: string
  phoneNumber?: string
}
export type UpdatePasswordArgs = {
  oldpassword: string
  newPassword: string
}
