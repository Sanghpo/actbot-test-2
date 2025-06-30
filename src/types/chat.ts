export interface ChatMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ChatResponse {
  success: boolean
  message?: string
  response?: string
  answer?: string
  error?: string
  error_code?: string
}

export interface UserStoryQueryRequest {
  API_key: string
  API_secret: string
  public_project_id: string
  client_uuid: string
  question: string
}

export interface UserStoryQueryResponse {
  success: boolean
  response?: string
  error?: string
  error_code?: string
}

export interface ChatQuestionRequest {
  API_key: string
  API_secret: string
  public_project_id: string
  type: 'chat'
  payload: {
    client_uuid: string
    questions: string
  }
}

export interface ChatQuestionResponse {
  success: boolean
  answer?: string
  error?: string
  error_code?: string
}