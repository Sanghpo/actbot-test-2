import { supabase } from '../lib/supabaseClient'
import type { UserStoryQueryRequest, UserStoryQueryResponse } from '../types/chat'

// Query user story using the Edge Function
export async function queryUserStory(
  apiKey: string,
  apiSecret: string,
  publicProjectId: string,
  clientUuid: string,
  question: string
): Promise<UserStoryQueryResponse> {
  try {
    console.log('🤖 Querying user story via Edge Function...')
    console.log('Public Project ID:', publicProjectId)
    console.log('Client UUID:', clientUuid)
    console.log('Question:', question)

    // Debug: Log the expected Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const expectedFunctionUrl = `${supabaseUrl}/functions/v1/query-user-story` 
    console.log('🔗 Expected Edge Function URL:', expectedFunctionUrl)
    
    // Debug: Log request payload
    const requestPayload: UserStoryQueryRequest = {
      API_key: apiKey,
      API_secret: apiSecret,
      public_project_id: publicProjectId,
      client_uuid: clientUuid,
      question: question
    }
    console.log('📤 Request payload:', {
      ...requestPayload,
      API_key: apiKey.substring(0, 8) + '...',
      API_secret: apiSecret.substring(0, 8) + '...'
    })

    console.log('⏳ Calling supabase.functions.invoke...')
    
    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('query-user-story', {
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
        error: data.error || 'Query failed',
        error_code: data.error_code
      }
    }

    return {
      success: true,
      response: data.response || 'I received your question but couldn\'t generate a proper response.'
    }
  } catch (error) {
    console.error('❌ Catch block - Error querying user story:')
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

// Generate user story using the Edge Function
export async function generateUserStory(
  projectId: string,
  clientUuid: string,
  activityLogs: Array<{
    action: string
    event: string
    event_details: string
    timestamp: string
  }>
): Promise<{ success: boolean; story_id?: string; story_text?: string; error?: string }> {
  try {
    console.log('🤖 Generating user story via Edge Function...')
    
    const requestPayload = {
      project_id: projectId,
      client_uuid: clientUuid,
      activity_logs: activityLogs
    }
    
    console.log('📤 Request payload:', requestPayload)

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('generate-user-story', {
      body: requestPayload
    })

    if (error) {
      console.error('❌ Edge function error:', error)
      return {
        success: false,
        error: `Edge Function error: ${error.message || 'Unknown error'}`
      }
    }

    console.log('✅ User story generation response:', data)

    if (!data.success) {
      return {
        success: false,
        error: data.error || 'Story generation failed'
      }
    }

    return {
      success: true,
      story_id: data.story_id,
      story_text: data.story_text
    }
  } catch (error) {
    console.error('❌ Error generating user story:', error)
    return {
      success: false,
      error: `Failed to generate user story: ${error.message || 'Unknown error'}`
    }
  }
}