import { supabase } from '../lib/supabaseClient'

export interface IngestLogsRequest {
  API_key: string
  API_secret: string
  public_project_id: string
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

// Send log ingestion request using the Edge Function
export async function ingestLog(requestData: IngestLogsRequest): Promise<IngestLogsResponse> {
  try {
    console.log('📤 Sending log ingestion request via Edge Function...')
    console.log('Public Project ID:', requestData.public_project_id)
    console.log('Payload:', requestData.payload)

    // Debug: Log the expected Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const expectedFunctionUrl = `${supabaseUrl}/functions/v1/ingest-logs` 
    console.log('🔗 Expected Edge Function URL:', expectedFunctionUrl)
    
    // Debug: Log request payload (without sensitive data)
    console.log('📤 Request payload:', {
      ...requestData,
      API_key: requestData.API_key.substring(0, 8) + '...',
      API_secret: requestData.API_secret.substring(0, 8) + '...'
    })

    console.log('⏳ Calling supabase.functions.invoke...')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('ingest-logs', {
      body: requestData
    })

    console.log('📥 Raw response from Edge Function:')
    console.log('- data:', data)
    console.log('- error:', error)

    if (error) {
      console.error('❌ Edge function error details:')
      console.error('- message:', error.message)
      console.error('- details:', error.details)
      console.error('- hint:', error.hint)
      console.error('- code:', error.code)
      console.error('- full error object:', error)
      
      return {
        success: false,
        message: `Edge Function error: ${error.message || 'Unknown error'}`,
        error: error.message || 'Unknown error',
        error_code: error.code || 'EDGE_FUNCTION_ERROR'
      }
    }

    console.log('✅ Edge function response received successfully')
    console.log('Response data type:', typeof data)
    console.log('Response data keys:', data ? Object.keys(data) : 'null/undefined')

    if (!data.success) {
      return {
        success: false,
        message: data.message || 'Log ingestion failed',
        error: data.error || 'Log ingestion failed',
        error_code: data.error_code
      }
    }

    return {
      success: true,
      message: data.message || 'Log ingested successfully',
      log_id: data.log_id
    }
  } catch (error) {
    console.error('❌ Catch block - Error sending log ingestion request:')
    console.error('- Error type:', error.constructor.name)
    console.error('- Error message:', error.message)
    console.error('- Error stack:', error.stack)
    console.error('- Full error object:', error)
    
    return {
      success: false,
      message: `Failed to send request to the Edge Function: ${error.message || 'Unknown network error'}`,
      error: error.message || 'Unknown network error',
      error_code: 'NETWORK_ERROR'
    }
  }
}