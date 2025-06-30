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

interface QueryUserStoryRequest {
  API_key: string
  API_secret: string
  public_project_id: string
  client_uuid: string
  question: string
}

interface QueryUserStoryResponse {
  success: boolean
  response?: string
  error?: string
  error_code?: string
}

// Query user story using Gemini AI
async function queryUserStoryWithAI(userStory: string, question: string): Promise<string> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured')
  }

  // Create a comprehensive prompt for answering questions about user activity
  const prompt = `You are an AI assistant that answers questions about user activity based on their activity story. 

User Activity Story:
${userStory}

User's Question: ${question}

Please provide a helpful, contextual response based on the user's activity data. If the question cannot be answered from the available activity data, politely explain what information is available and suggest how the user might get the answer they're looking for.

Keep your response conversational, informative, and focused on the user's specific question. Use insights from their activity pattern to provide valuable context.

Response:`

  console.log('🤖 Calling Gemini API for user story query...')
  
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

// Generate a fallback response without AI
function generateFallbackResponse(userStory: string, question: string): string {
  if (!userStory || userStory.trim() === '') {
    return "I don't have enough activity data for this user yet. As they use the application more, I'll be able to provide better insights about their behavior and answer questions about their activity patterns."
  }

  // Simple keyword-based responses
  const lowerQuestion = question.toLowerCase()
  
  if (lowerQuestion.includes('activity') || lowerQuestion.includes('what') || lowerQuestion.includes('summary')) {
    return `Based on the available data, here's what I can tell you about this user's activity:\n\n${userStory.substring(0, 500)}${userStory.length > 500 ? '...' : ''}`
  }
  
  if (lowerQuestion.includes('when') || lowerQuestion.includes('time')) {
    return `I can see activity patterns in the user story, but for specific timing questions, you might want to check the detailed activity logs. The user story shows: ${userStory.substring(0, 300)}${userStory.length > 300 ? '...' : ''}`
  }
  
  if (lowerQuestion.includes('how many') || lowerQuestion.includes('count')) {
    return `For specific counts and metrics, I'd recommend checking the detailed analytics. Based on the user story, I can see various activities, but exact numbers would be in the raw activity data.`
  }
  
  // Default response
  return `I can help answer questions about this user's activity patterns. Here's their current activity summary:\n\n${userStory.substring(0, 400)}${userStory.length > 400 ? '...' : ''}\n\nCould you be more specific about what you'd like to know?`
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
    console.log('🚀 Query-user-story Edge Function called')
    
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
    const requestBody: QueryUserStoryRequest = await req.json()
    console.log('📝 Request body received:', {
      hasApiKey: !!requestBody.API_key,
      hasApiSecret: !!requestBody.API_secret,
      publicProjectId: requestBody.public_project_id,
      clientUuid: requestBody.client_uuid,
      hasQuestion: !!requestBody.question
    })
    
    // Validate request structure
    if (!requestBody.API_key || !requestBody.API_secret || !requestBody.public_project_id || !requestBody.client_uuid || !requestBody.question) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: API_key, API_secret, public_project_id, client_uuid, and question are required',
          error_code: 'MISSING_FIELDS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Request validation passed, converting public project ID...')

    // Convert public project ID to internal UUID
    const { data: projectId, error: projectError } = await supabase.rpc('get_project_uuid_from_public_id', {
      p_public_id: requestBody.public_project_id
    })

    if (projectError || !projectId) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid project ID',
          error_code: 'INVALID_PROJECT_ID'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Project ID converted, validating API credentials...')

    // Validate API key and secret using the existing function
    const { data: validationData, error: validationError } = await supabase.rpc('validate_project_api_key', {
      p_api_key: requestBody.API_key
    })

    if (validationError || !validationData || validationData.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API key',
          error_code: 'INVALID_API_KEY'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const validation = validationData[0]
    if (!validation.is_valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API key',
          error_code: 'INVALID_API_KEY'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify API secret matches
    const { data: secretCheck, error: secretError } = await supabase
      .from('project_api_keys')
      .select('id')
      .eq('api_key', requestBody.API_key)
      .eq('api_secret', requestBody.API_secret)
      .eq('is_active', true)
      .maybeSingle()

    if (secretError || !secretCheck) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid API secret',
          error_code: 'INVALID_API_SECRET'
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify project access
    if (validation.project_id !== projectId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Project access denied',
          error_code: 'PROJECT_ACCESS_DENIED'
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ API credentials validated, fetching user story...')

    // Fetch the user story for this client
    const { data: userStoryData, error: storyError } = await supabase
      .from('client_user_stories')
      .select('story_text')
      .eq('project_id', projectId)
      .eq('client_uuid', requestBody.client_uuid)
      .maybeSingle()

    if (storyError) {
      console.error('❌ Error fetching user story:', storyError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Failed to fetch user story',
          error_code: 'DATABASE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userStory = userStoryData?.story_text || ''
    console.log('📖 User story fetched, length:', userStory.length)

    // Generate response using AI or fallback
    let response: string
    
    try {
      // Try to generate response with AI first
      response = await queryUserStoryWithAI(userStory, requestBody.question)
      console.log('✅ Response generated with AI')
    } catch (aiError) {
      console.warn('⚠️ AI query failed, using fallback:', aiError.message)
      // Fall back to rule-based response
      response = generateFallbackResponse(userStory, requestBody.question)
      console.log('✅ Response generated with fallback method')
    }

    // Track the API call
    await supabase.rpc('track_api_call', {
      p_api_key_id: secretCheck.id,
      p_user_id: validation.user_id,
      p_project_id: projectId,
      p_endpoint: '/functions/v1/query-user-story',
      p_call_type: 'user_story_query',
      p_request_metadata: {
        client_uuid: requestBody.client_uuid,
        question_length: requestBody.question.length,
        has_user_story: !!userStory
      },
      p_response_status: 200
    }).catch(error => console.error('Failed to track API call:', error))

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        response: response
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