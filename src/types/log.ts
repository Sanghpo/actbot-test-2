export interface ClientActivityLog {
  id?: string
  user_id: string
  project_id: string
  client_uuid: string
  action: 'create' | 'update' | 'delete' | 'other'
  event: string
  event_details: string
  timestamp: string
  ingested_at?: string
}

export interface ApiCall {
  id?: string
  api_key_id?: string
  user_id?: string
  project_id?: string
  endpoint: string
  call_type: string
  request_metadata?: Record<string, any>
  response_status?: number
  response_time_ms?: number
  called_at?: string
}

export interface ClientUserStory {
  id?: string
  user_id: string
  project_id: string
  client_uuid: string
  story_text: string
  last_activity_log_id?: string
  generated_at?: string
  updated_at?: string
}

export interface IngestLogsRequest {
  API_key: string
  API_secret: string
  project_id: string
  type: 'log'
  payload: {
    client_uuid: string
    action: 'create' | 'update' | 'delete' | 'other'
    event: string
    event_details: string
    timestamp: string
  }
}

export interface IngestLogsResponse {
  success: boolean
  message: string
  log_id?: string
  error?: string
  error_code?: string
}

// Legacy interface for backward compatibility
export interface LogEntry extends ClientActivityLog {}