export interface User {
  id: string
  email?: string
  phone?: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
    provider?: string
  }
  created_at: string
}

export interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
  needsEmailVerification?: boolean
}

export interface SignupData {
  phone?: string
  email?: string
  password?: string
  fullName?: string
}

export interface LoginData {
  phone?: string
  email?: string
  password?: string
  otp?: string
}

export interface OTPVerification {
  phone: string
  token: string
}