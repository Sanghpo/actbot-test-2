import { supabase } from '../lib/supabaseClient'
import type { ChatMessage, ChatResponse } from '../types/chat'

// Query the LLM with user story context and user question using the Edge Function
export async function queryLLM(userStory: string, userQuestion: string): Promise<ChatResponse> {
  try {
    console.log('🤖 Querying LLM via Edge Function...')
    console.log('User story length:', userStory.length)
    console.log('User question:', userQuestion)

    // Debug: Log the expected Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const expectedFunctionUrl = `${supabaseUrl}/functions/v1/bright-api` 
    console.log('🔗 Expected Edge Function URL:', expectedFunctionUrl)
    
    // Debug: Log request payload
    const requestPayload = {
      userStory: userStory,
      userQuestion: userQuestion,
      userId: 1
    }
    console.log('📤 Request payload:', requestPayload)

    console.log('⏳ Calling supabase.functions.invoke...')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('bright-api', {
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

    return {
      success: true,
      message: data?.response || data?.message || 'I received your question but couldn\'t generate a proper response.'
    }
  } catch (error) {
    console.error('❌ Catch block - Error querying LLM:')
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

// Main function that only uses the Edge Function (no fallback)
export async function queryLLMWithFallback(userStory: string, userQuestion: string): Promise<ChatResponse> {
  return queryLLM(userStory, userQuestion)
}