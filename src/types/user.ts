export interface UserProfile {
  id?: string
  user_id: string
  full_name?: string
  phone?: string
  avatar_url?: string
  settings?: UserSettings
  created_at?: string
  updated_at?: string
}

export interface UserSettings {
  email_notifications: boolean
  security_alerts: boolean
  marketing_emails: boolean
  weekly_reports: boolean
  theme?: 'light' | 'dark' | 'auto'
  timezone?: string
  language?: string
}

export interface BillingInfo {
  current_plan: 'free' | 'pro' | 'enterprise'
  billing_cycle: 'monthly' | 'yearly'
  next_billing_date?: string
  payment_method?: PaymentMethod
  billing_history: BillingHistoryItem[]
}

export interface PaymentMethod {
  id: string
  type: 'card' | 'paypal' | 'bank'
  last_four?: string
  brand?: string
  expires?: string
}

export interface BillingHistoryItem {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  description: string
  invoice_url?: string
}

export interface UsageStats {
  current_period: {
    requests: number
    projects: number
    api_keys: number
    storage_mb: number
  }
  limits: {
    requests: number
    projects: number
    api_keys: number
    storage_mb: number
  }
  usage_percentage: {
    requests: number
    projects: number
    api_keys: number
    storage_mb: number
  }
}