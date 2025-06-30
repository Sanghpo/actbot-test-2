import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Load Supabase configuration from environment
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// Create Supabase client with service role key for server-side operations
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface IngestLogsRequest {
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

interface IngestLogsResponse {
  success: boolean
  message: string
  log_id?: string
  error?: string
  error_code?: string
}

// Auto-generate user story after log ingestion
async function autoGenerateUserStory(projectId: string, clientUuid: string): Promise<void> {
  try {
    console.log('🤖 Auto-generating user story for client:', clientUuid)
    
    // Get recent activity logs for this client (last 50 logs)
    const { data: recentLogs, error: logsError } = await supabase
      .from('client_activity_logs')
      .select('action, event, event_details, timestamp')
      .eq('project_id', projectId)
      .eq('client_uuid', clientUuid)
      .order('timestamp', { ascending: false })
      .limit(50)

    if (logsError) {
      console.error('❌ Error fetching recent logs:', logsError)
      return
    }

    if (!recentLogs || recentLogs.length === 0) {
      console.log('ℹ️ No recent logs found for user story generation')
      return
    }

    // Call the generate-user-story function
    const generateStoryResponse = await fetch(`${supabaseUrl}/functions/v1/generate-user-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        project_id: projectId,
        client_uuid: clientUuid,
        activity_logs: recentLogs
      })
    })

    if (!generateStoryResponse.ok) {
      console.error('❌ Error calling generate-user-story function:', generateStoryResponse.status)
      return
    }

    const storyResult = await generateStoryResponse.json()
    
    if (storyResult.success) {
      console.log('✅ User story auto-generated successfully')
    } else {
      console.error('❌ User story generation failed:', storyResult.error)
    }
  } catch (error) {
    console.error('❌ Error in auto-generating user story:', error)
  }
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
    console.log('🚀 Ingest-logs Edge Function called')
    
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
    const requestBody: IngestLogsRequest = await req.json()
    console.log('📝 Request body received:', {
      hasApiKey: !!requestBody.API_key,
      hasApiSecret: !!requestBody.API_secret,
      publicProjectId: requestBody.public_project_id,
      type: requestBody.type,
      hasPayload: !!requestBody.payload
    })
    
    // Validate request structure
    if (!requestBody.API_key || !requestBody.API_secret || !requestBody.public_project_id || !requestBody.payload) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required fields: API_key, API_secret, public_project_id, and payload are required',
          error_code: 'MISSING_FIELDS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate type field
    if (requestBody.type !== 'log') {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid type. Must be "log"',
          error_code: 'INVALID_TYPE'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate payload structure
    const { payload } = requestBody
    if (!payload.client_uuid || !payload.action || !payload.event || !payload.event_details || !payload.timestamp) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required payload fields: client_uuid, action, event, event_details, and timestamp are required',
          error_code: 'MISSING_PAYLOAD_FIELDS'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate timestamp format
    const timestamp = new Date(payload.timestamp)
    if (isNaN(timestamp.getTime())) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid timestamp format. Use ISO 8601 format (e.g., 2024-01-15T10:30:00Z)',
          error_code: 'INVALID_TIMESTAMP'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate action type
    if (!['create', 'update', 'delete', 'other'].includes(payload.action)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid action type. Must be one of: create, update, delete, other',
          error_code: 'INVALID_ACTION'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Request validation passed, calling ingest function...')

    // Call the database function to ingest the client activity log
    const { data, error } = await supabase.rpc('ingest_client_activity_log', {
      p_api_key: requestBody.API_key,
      p_api_secret: requestBody.API_secret,
      p_public_project_id: requestBody.public_project_id,
      p_client_uuid: payload.client_uuid,
      p_action: payload.action,
      p_event: payload.event,
      p_event_details: payload.event_details,
      p_timestamp: timestamp.toISOString()
    })

    if (error) {
      console.error('❌ Database function error:', error)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Database error occurred',
          error_code: 'DATABASE_ERROR'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!data || data.length === 0) {
      console.error('❌ No data returned from database function')
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No response from database',
          error_code: 'NO_DATABASE_RESPONSE'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = data[0]
    console.log('📊 Database function result:', result)

    if (!result.success) {
      // Map database error codes to HTTP status codes
      let statusCode = 400
      if (result.error_code === 'INVALID_API_KEY' || result.error_code === 'INVALID_API_SECRET') {
        statusCode = 401
      } else if (result.error_code === 'PROJECT_ACCESS_DENIED') {
        statusCode = 403
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: result.message,
          error_code: result.error_code
        }),
        { 
          status: statusCode, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Client activity log entry created successfully:', result.log_id)

    // Get the internal project ID for auto-generating user story
    const { data: projectData } = await supabase.rpc('get_project_uuid_from_public_id', {
      p_public_id: requestBody.public_project_id
    })

    if (projectData) {
      // Auto-generate user story in the background (don't wait for it)
      autoGenerateUserStory(projectData, payload.client_uuid)
        .catch(error => console.error('❌ Background user story generation failed:', error))
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: result.message,
        log_id: result.log_id
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