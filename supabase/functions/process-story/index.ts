const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Load secrets from environment
const geminiApiKey = Deno.env.get('Gemini_api_key') ?? ''

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Edge Function called')
    
    if (!geminiApiKey) {
      console.error('❌ Missing Gemini API key')
      return new Response(
        JSON.stringify({ error: 'Gemini API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const requestBody = await req.json()
    console.log('📝 Request body:', requestBody)
    
    const { userStory, userQuestion, userId } = requestBody
    
    if (!userQuestion) {
      return new Response(
        JSON.stringify({ error: 'User question is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const story = userStory || 'No user activity available yet.'
    console.log('📖 User story length:', story.length)
    console.log('❓ User question:', userQuestion)

    // Create a more detailed prompt for Gemini
    const prompt = `You are an AI assistant helping users understand their todo app activity. 

User Activity Data:
${story}

User's Question: ${userQuestion}

Please provide a helpful, contextual response based on their activity data. If there's no activity data, encourage them to start using the app. Keep your response conversational and helpful.`

    console.log('🤖 Calling Gemini API with prompt length:', prompt.length)
    
    // Call Gemini API
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
      const errorText = await geminiResponse.text()
      console.error('❌ Gemini API error details:', errorText)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get response from AI service',
          details: `API returned ${geminiResponse.status}: ${geminiResponse.statusText}`
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const data = await geminiResponse.json()
    console.log('✅ Gemini API response structure:', JSON.stringify(data, null, 2))
    
    // Better response extraction with fallbacks
    let result = 'I apologize, but I couldn\'t generate a proper response. Please try asking your question differently.'
    
    if (data?.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0]
      console.log('📋 First candidate:', JSON.stringify(candidate, null, 2))
      
      if (candidate?.content?.parts && candidate.content.parts.length > 0) {
        const text = candidate.content.parts[0]?.text
        if (text && text.trim()) {
          result = text.trim()
          console.log('✅ Extracted response text:', result.substring(0, 100) + '...')
        } else {
          console.log('⚠️ No text found in parts')
        }
      } else {
        console.log('⚠️ No content parts found')
      }
      
      // Check for finish reason
      if (candidate.finishReason) {
        console.log('🏁 Finish reason:', candidate.finishReason)
        if (candidate.finishReason === 'SAFETY') {
          result = 'I apologize, but I cannot provide a response due to safety guidelines. Please try rephrasing your question.'
        }
      }
    } else {
      console.log('⚠️ No candidates found in response')
    }
    
    console.log('📤 Final response being sent:', result.substring(0, 100) + '...')
    
    return new Response(
      JSON.stringify({
        response: result,
        success: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})