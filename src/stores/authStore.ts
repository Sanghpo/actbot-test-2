import { writable } from 'svelte/store'
import { supabase } from '../lib/supabaseClient'
import type { AuthState, User, SignupData, LoginData, OTPVerification } from '../types/auth'

// Create auth store
export const authStore = writable<AuthState>({
  user: null,
  loading: true,
  error: null,
  needsEmailVerification: false
})

// Helper to update auth state
function updateAuthState(updates: Partial<AuthState>) {
  authStore.update(state => ({ ...state, ...updates }))
}

// Helper to format error messages for better user experience
function formatAuthError(error: any, email?: string): { message: string; type: 'email_not_found' | 'wrong_password' | 'general' } {
  if (!error) return { message: 'An unknown error occurred', type: 'general' }
  
  const message = error.message || error.toString()
  
  // Handle common Supabase auth errors with specific types
  if (message.includes('Invalid login credentials')) {
    return { 
      message: 'Incorrect password. Please try again.', 
      type: 'wrong_password' 
    }
  }
  
  if (message.includes('User not found') || message.includes('No user found')) {
    return { 
      message: 'No account found with this email address.', 
      type: 'email_not_found' 
    }
  }
  
  if (message.includes('Email not confirmed')) {
    return { 
      message: 'Please check your email and click the confirmation link before signing in.', 
      type: 'general' 
    }
  }
  
  if (message.includes('Too many requests')) {
    return { 
      message: 'Too many login attempts. Please wait a few minutes before trying again.', 
      type: 'general' 
    }
  }
  
  if (message.includes('Invalid email')) {
    return { 
      message: 'Please enter a valid email address.', 
      type: 'general' 
    }
  }
  
  if (message.includes('Password should be at least')) {
    return { 
      message: 'Password must be at least 6 characters long.', 
      type: 'general' 
    }
  }
  
  if (message.includes('Unable to validate email address')) {
    return { 
      message: 'Please enter a valid email address.', 
      type: 'general' 
    }
  }
  
  // Return the original message if no specific handling is needed
  return { message, type: 'general' }
}

// Initialize auth state
export async function initializeAuth() {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Error getting session:', error)
      const formattedError = formatAuthError(error)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return
    }

    if (session?.user) {
      updateAuthState({ 
        user: session.user as User, 
        loading: false, 
        error: null,
        needsEmailVerification: false
      })
    } else {
      updateAuthState({ 
        user: null, 
        loading: false, 
        error: null,
        needsEmailVerification: false
      })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        updateAuthState({ 
          user: session.user as User, 
          loading: false, 
          error: null,
          needsEmailVerification: false
        })
      } else {
        updateAuthState({ 
          user: null, 
          loading: false, 
          error: null,
          needsEmailVerification: false
        })
      }
    })
  } catch (error) {
    console.error('Error initializing auth:', error)
    const formattedError = formatAuthError(error)
    updateAuthState({ 
      loading: false, 
      error: formattedError.message,
      needsEmailVerification: false
    })
  }
}

// Sign up with email and password
export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || ''
        }
      }
    })

    if (error) {
      const formattedError = formatAuthError(error, email)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return { success: false, error: formattedError.message, errorType: formattedError.type, needsEmailVerification: false }
    }

    // Check if user was created but needs email verification
    const needsVerification = data.user && !data.session
    
    updateAuthState({ 
      loading: false, 
      error: null, 
      needsEmailVerification: needsVerification 
    })
    
    return { 
      success: true, 
      data, 
      needsEmailVerification: needsVerification 
    }
  } catch (error) {
    const formattedError = formatAuthError(error, email)
    updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
    return { success: false, error: formattedError.message, errorType: formattedError.type, needsEmailVerification: false }
  }
}

// Sign in with email and password with enhanced error handling
export async function signInWithEmail(email: string, password: string) {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      const formattedError = formatAuthError(error, email)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return { 
        success: false, 
        error: formattedError.message, 
        errorType: formattedError.type,
        email: email // Include email for UI handling
      }
    }

    updateAuthState({ loading: false, error: null, needsEmailVerification: false })
    return { success: true, data }
  } catch (error) {
    const formattedError = formatAuthError(error, email)
    updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
    return { 
      success: false, 
      error: formattedError.message, 
      errorType: formattedError.type,
      email: email
    }
  }
}

// Sign in with Google
export async function signInWithGoogle() {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      const formattedError = formatAuthError(error)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return { success: false, error: formattedError.message, errorType: formattedError.type }
    }

    // Note: OAuth redirects, so loading state will be handled by the redirect
    return { success: true, data }
  } catch (error) {
    const formattedError = formatAuthError(error)
    updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
    return { success: false, error: formattedError.message, errorType: formattedError.type }
  }
}

// Sign out
export async function signOut() {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    const { error } = await supabase.auth.signOut()

    if (error) {
      const formattedError = formatAuthError(error)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return { success: false, error: formattedError.message, errorType: formattedError.type }
    }

    updateAuthState({ user: null, loading: false, error: null, needsEmailVerification: false })
    return { success: true }
  } catch (error) {
    const formattedError = formatAuthError(error)
    updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
    return { success: false, error: formattedError.message, errorType: formattedError.type }
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    updateAuthState({ loading: true, error: null, needsEmailVerification: false })
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      const formattedError = formatAuthError(error, email)
      updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
      return { success: false, error: formattedError.message, errorType: formattedError.type }
    }

    updateAuthState({ loading: false, error: null, needsEmailVerification: false })
    return { success: true, data, message: 'Password reset email sent' }
  } catch (error) {
    const formattedError = formatAuthError(error, email)
    updateAuthState({ loading: false, error: formattedError.message, needsEmailVerification: false })
    return { success: false, error: formattedError.message, errorType: formattedError.type }
  }
}

// Resend email verification
export async function resendEmailVerification() {
  try {
    updateAuthState({ loading: true, error: null })
    
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: '' // This will use the current user's email
    })

    if (error) {
      const formattedError = formatAuthError(error)
      updateAuthState({ loading: false, error: formattedError.message })
      return { success: false, error: formattedError.message }
    }

    updateAuthState({ loading: false, error: null })
    return { success: true, message: 'Verification email sent' }
  } catch (error) {
    const formattedError = formatAuthError(error)
    updateAuthState({ loading: false, error: formattedError.message })
    return { success: false, error: formattedError.message }
  }
}