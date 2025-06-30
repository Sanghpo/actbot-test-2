import { supabase } from '../lib/supabaseClient'
import type { ChatQuestionRequest, ChatQuestionResponse } from '../types/chat'

// Send chat question using the Edge Function
export async function sendChatQuestion(
  apiKey: string,
  apiSecret: string,
  publicProjectId: string,
  clientUuid: string,
  question: string
): Promise<ChatQuestionResponse> {
  try {
    console.log('💬 Sending chat question via Edge Function...')
    console.log('Public Project ID:', publicProjectId)
    console.log('Client UUID:', clientUuid)
    console.log('Question:', question)

    // Debug: Log the expected Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const expectedFunctionUrl = `${supabaseUrl}/functions/v1/chat-question` 
    console.log('🔗 Expected Edge Function URL:', expectedFunctionUrl)
    
    // Debug: Log request payload
    const requestPayload: ChatQuestionRequest = {
      API_key: apiKey,
      API_secret: apiSecret,
      public_project_id: publicProjectId,
      type: 'chat',
      payload: {
        client_uuid: clientUuid,
        questions: question
      }
    }
    console.log('📤 Request payload:', {
      ...requestPayload,
      API_key: apiKey.substring(0, 8) + '...',
      API_secret: apiSecret.substring(0, 8) + '...'
    })

    console.log('⏳ Calling supabase.functions.invoke...')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('chat-question', {
      body: requestPayload
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
        error: `Edge Function error: ${error.message || 'Unknown error'}`
      }
    }

    console.log('✅ Edge function response received successfully')
    console.log('Response data type:', typeof data)
    console.log('Response data keys:', data ? Object.keys(data) : 'null/undefined')

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Chat question failed',
        error_code: data.error_code
      }
    }

    return {
      success: true,
      answer: data.answer || 'I received your question but couldn\'t generate a proper response.'
    }
  } catch (error) {
    console.error('❌ Catch block - Error sending chat question:')
    console.error('- Error type:', error.constructor.name)
    console.error('- Error message:', error.message)
    console.error('- Error stack:', error.stack)
    console.error('- Full error object:', error)
    
    return {
      success: false,
      error: `Failed to send a request to the Edge Function: ${error.message || 'Unknown network error'}`
    }
  }
}