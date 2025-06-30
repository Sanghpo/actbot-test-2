export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  public_id: string
  created_at: string
  updated_at: string
}

export interface ProjectApiKey {
  id: string
  project_id: string
  api_key: string
  api_secret: string
  name: string
  is_active: boolean
  last_used_at?: string
  usage_count: number
  created_at: string
}

export interface CreateProjectData {
  name: string
  description?: string
}

export interface CreateApiKeyData {
  project_id: string
  name: string
}

export interface ApiKeyResponse {
  api_key: string
  api_secret: string
  key_name: string
  project_name: string
}