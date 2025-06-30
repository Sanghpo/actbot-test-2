import { writable } from 'svelte/store'
import { supabase } from '../lib/supabaseClient'
import { authStore } from './authStore'
import { get } from 'svelte/store'
import type { ClientActivityLog, ApiCall, ClientUserStory } from '../types/log'

export const clientActivityLogsStore = writable<ClientActivityLog[]>([])
export const apiCallsStore = writable<ApiCall[]>([])
export const clientUserStoriesStore = writable<ClientUserStory[]>([])

// Helper function to get current user ID
function getCurrentUserId(): string | null {
  const auth = get(authStore)
  return auth.user?.id || null
}

// Load client activity logs for user's projects
export async function loadClientActivityLogs(projectId?: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('No authenticated user, skipping logs load')
      clientActivityLogsStore.set([])
      return
    }

    console.log('Loading client activity logs for user:', userId)
    
    let query = supabase
      .from('client_activity_logs')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', userId)
      .order('ingested_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading client activity logs:', error)
      return
    }

    console.log('Loaded client activity logs:', data?.length || 0)
    clientActivityLogsStore.set(data || [])
  } catch (error) {
    console.error('Error loading client activity logs:', error)
  }
}

// Load API calls for user's projects
export async function loadApiCalls(projectId?: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('No authenticated user, skipping API calls load')
      apiCallsStore.set([])
      return
    }

    console.log('Loading API calls for user:', userId)
    
    let query = supabase
      .from('api_calls')
      .select('*')
      .eq('user_id', userId)
      .order('called_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading API calls:', error)
      return
    }

    console.log('Loaded API calls:', data?.length || 0)
    apiCallsStore.set(data || [])
  } catch (error) {
    console.error('Error loading API calls:', error)
  }
}

// Load client user stories for user's projects
export async function loadClientUserStories(projectId?: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('No authenticated user, skipping user stories load')
      clientUserStoriesStore.set([])
      return
    }

    console.log('Loading client user stories for user:', userId)
    
    let query = supabase
      .from('client_user_stories')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', userId)
      .order('updated_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading client user stories:', error)
      return
    }

    console.log('Loaded client user stories:', data?.length || 0)
    clientUserStoriesStore.set(data || [])
  } catch (error) {
    console.error('Error loading client user stories:', error)
  }
}

// Create or update a client user story
export async function upsertClientUserStory(
  projectId: string,
  clientUuid: string,
  storyText: string,
  lastActivityLogId?: string
) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Upserting client user story:', { projectId, clientUuid })
    
    const storyData = {
      user_id: userId,
      project_id: projectId,
      client_uuid: clientUuid,
      story_text: storyText,
      last_activity_log_id: lastActivityLogId
    }

    // Check if story exists for this client
    const { data: existingStory, error: checkError } = await supabase
      .from('client_user_stories')
      .select('*')
      .eq('project_id', projectId)
      .eq('client_uuid', clientUuid)
      .maybeSingle()

    let result
    if (!checkError && existingStory) {
      // Update existing story
      const { data, error } = await supabase
        .from('client_user_stories')
        .update({
          story_text: storyText,
          last_activity_log_id: lastActivityLogId
        })
        .eq('id', existingStory.id)
        .select()

      if (error) {
        console.error('Error updating client user story:', error)
        return { success: false, error: error.message }
      }
      result = data
    } else {
      // Insert new story
      const { data, error } = await supabase
        .from('client_user_stories')
        .insert([storyData])
        .select()

      if (error) {
        console.error('Error inserting client user story:', error)
        return { success: false, error: error.message }
      }
      result = data
    }

    if (result && result.length > 0) {
      // Reload stories to update the store
      await loadClientUserStories()
      return { success: true, story: result[0] }
    }

    return { success: false, error: 'No data returned' }
  } catch (error) {
    console.error('Error upserting client user story:', error)
    return { success: false, error: error.message }
  }
}