import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Load Supabase configuration and Gemini API key from environment
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const geminiApiKey = Deno.env.get('Gemini_api_key') ?? ''

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface GenerateUserStoryRequest {
  project_id: string
  client_uuid: string
  activity_logs: Array<{
    action: string
    event: string
    event_details: string
    timestamp: string
  }>
}

interface GenerateUserStoryResponse {
  success: boolean
  message: string
  story_id?: string
  story_text?: string
  error?: string
  error_code?: string
}

// Generate user story using Gemini AI
async function generateUserStoryWithAI(activityLogs: any[]): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Create a comprehensive prompt for generating user stories
  const prompt = `You are an AI assistant that creates comprehensive user activity summaries based on application logs. 

Activity Logs:
${activityLogs.map(log => 
  `- ${log.timestamp}: ${log.action.toUpperCase()} - ${log.event} (${log.event_details})`
).join('\n')}

Please create a comprehensive user story that:
1. Summarizes the user's journey and activities chronologically
2. Identifies patterns in user behavior
3. Highlights key actions and milestones
4. Provides insights into user engagement
5. Uses natural, flowing language that tells a story

The story should be informative yet concise, focusing on the user's experience and behavior patterns. Write it as a narrative that could help understand this user's interaction with the application.

User Story:`

  console.log('🤖 Calling Gemini API for user story generation...')
  
  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        })
      }
    )

    if (!geminiResponse.ok) {
      console.error('❌ Gemini API error:', geminiResponse.status, geminiResponse.statusText)
      throw new Error(`Gemini API returned ${geminiResponse.status}: ${geminiResponse.statusText}`)
    }

    const data = await geminiResponse.json()
    console.log('✅ Gemini API response received')
    
    // Extract the generated text
    if (data?.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0]?.text
        if (text && text.trim()) {
          return text.trim()
        }
      }
    }
    
    throw new Error('No valid response from Gemini API')
  } catch (error) {
    console.error('❌ Error calling Gemini API:', error)
    throw error
  }
}

// Generate a fallback user story without AI
function generateFallbackUserStory(activityLogs: any[]): string {
  const sortedLogs = activityLogs.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  
  const actionCounts = {}
  const eventTypes = new Set()
  
  sortedLogs.forEach(log => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1
    eventTypes.add(log.event)
  })
  
  const firstActivity = sortedLogs[0]
  const lastActivity = sortedLogs[sortedLogs.length - 1]
  const totalActivities = sortedLogs.length
  
  let story = `User Activity Summary:\n\n`
  story += `This user has been active from ${new Date(firstActivity.timestamp).toLocaleDateString()} to ${new Date(lastActivity.timestamp).toLocaleDateString()}, `
  story += `with a total of ${totalActivities} recorded activities.\n\n`
  
  story += `Activity Breakdown:\n`
  Object.entries(actionCounts).forEach(([action, count]) => {
    story += `- ${action.charAt(0).toUpperCase() + action.slice(1)} actions: ${count}\n`
  })
  
  story += `\nEvent Types: ${Array.from(eventTypes).join(', ')}\n\n`
  
  story += `Recent Activity:\n`
  sortedLogs.slice(-5).forEach(log => {
    story += `- ${new Date(log.timestamp).toLocaleDateString()}: ${log.event} (${log.event_details})\n`
  })
  
  return story
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Method not allowed. Use POST.',
        error_code: 'METHOD_NOT_ALLOWED'
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }

  try {
    console.log('🚀 Generate-user-story Edge Function called')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase configuration')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Server configuration error',
          error_code: 'SERVER_CONFIG_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody: GenerateUserStoryRequest = await req.json()
    console.log('📝 Request body received:', {
      projectId: requestBody.project_id,
      clientUuid: requestBody.client_uuid,
      activityLogsCount: requestBody.activity_logs?.length || 0
    })
    
    // Validate request structure
    if (!requestBody.project_id || !requestBody.client_uuid || !requestBody.activity_logs) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: project_id, client_uuid, and activity_logs are required',
          error_code: 'MISSING_FIELDS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!Array.isArray(requestBody.activity_logs) || requestBody.activity_logs.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'activity_logs must be a non-empty array',
          error_code: 'INVALID_ACTIVITY_LOGS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Request validation passed, generating user story...')

    let generatedStory: string
    
    try {
      // Try to generate story with AI first
      generatedStory = await generateUserStoryWithAI(requestBody.activity_logs)
      console.log('✅ User story generated with AI')
    } catch (aiError) {
      console.warn('⚠️ AI generation failed, using fallback:', aiError.message)
      // Fall back to rule-based generation
      generatedStory = generateFallbackUserStory(requestBody.activity_logs)
      console.log('✅ User story generated with fallback method')
    }

    // Get the latest activity log ID for reference
    const latestLog = requestBody.activity_logs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]

    // Store or update the user story in the database
    console.log('💾 Storing user story in database...')
    
    // Check if a story already exists for this client
    const { data: existingStory, error: checkError } = await supabase
      .from('client_user_stories')
      .select('*')
      .eq('project_id', requestBody.project_id)
      .eq('client_uuid', requestBody.client_uuid)
      .maybeSingle()

    let result
    if (!checkError && existingStory) {
      // Update existing story
      const { data, error } = await supabase
        .from('client_user_stories')
        .update({
          story_text: generatedStory,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingStory.id)
        .select()

      if (error) {
        console.error('❌ Error updating user story:', error)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to update user story',
            error_code: 'DATABASE_UPDATE_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      result = data[0]
      console.log('✅ User story updated successfully')
    } else {
      // Create new story
      const { data, error } = await supabase
        .from('client_user_stories')
        .insert([{
          project_id: requestBody.project_id,
          client_uuid: requestBody.client_uuid,
          story_text: generatedStory,
          user_id: null // Will be set by RLS/trigger if needed
        }])
        .select()

      if (error) {
        console.error('❌ Error creating user story:', error)
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'Failed to create user story',
            error_code: 'DATABASE_INSERT_ERROR'
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      result = data[0]
      console.log('✅ User story created successfully')
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: existingStory ? 'User story updated successfully' : 'User story created successfully',
        story_id: result.id,
        story_text: generatedStory
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'Internal server error',
        error_code: 'INTERNAL_ERROR'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})