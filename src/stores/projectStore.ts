import { writable } from 'svelte/store'
import { supabase } from '../lib/supabaseClient'
import { authStore } from './authStore'
import { get } from 'svelte/store'
import type { Project, ProjectApiKey, CreateProjectData, CreateApiKeyData, ApiKeyResponse } from '../types/project'

export const projectStore = writable<Project[]>([])
export const apiKeysStore = writable<ProjectApiKey[]>([])

// Helper function to get current user ID
function getCurrentUserId(): string | null {
  const auth = get(authStore)
  return auth.user?.id || null
}

// Load user's projects
export async function loadProjects() {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('No authenticated user, skipping project load')
      projectStore.set([])
      return
    }

    console.log('Loading projects for user:', userId)
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading projects:', error)
      return
    }

    console.log('Loaded projects:', data)
    projectStore.set(data || [])
  } catch (error) {
    console.error('Error loading projects:', error)
  }
}

// Create a new project
export async function createProject(projectData: CreateProjectData) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Creating project:', projectData)
    const newProjectData = {
      name: projectData.name.trim(),
      description: projectData.description?.trim() || '',
      user_id: userId
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([newProjectData])
      .select()

    if (error) {
      console.error('Error creating project:', error)
      return { success: false, error: error.message }
    }

    console.log('Created project:', data)
    if (data && data.length > 0) {
      projectStore.update(projects => [data[0], ...projects])
      return { success: true, project: data[0] }
    }

    return { success: false, error: 'No data returned' }
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, error: error.message }
  }
}

// Update a project
export async function updateProject(projectId: string, updates: Partial<CreateProjectData>) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Updating project:', projectId, updates)
    const updateData = {
      ...(updates.name && { name: updates.name.trim() }),
      ...(updates.description !== undefined && { description: updates.description.trim() })
    }

    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()

    if (error) {
      console.error('Error updating project:', error)
      return { success: false, error: error.message }
    }

    console.log('Updated project:', data)
    if (data && data.length > 0) {
      projectStore.update(projects =>
        projects.map(project =>
          project.id === projectId ? data[0] : project
        )
      )
      return { success: true, project: data[0] }
    }

    return { success: false, error: 'Project not found' }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: error.message }
  }
}

// Delete a project
export async function deleteProject(projectId: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Deleting project:', projectId)
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting project:', error)
      return { success: false, error: error.message }
    }

    console.log('Deleted project:', projectId)
    projectStore.update(projects => projects.filter(project => project.id !== projectId))
    // Also remove API keys for this project
    apiKeysStore.update(keys => keys.filter(key => key.project_id !== projectId))
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: error.message }
  }
}

// Load API keys for a project
export async function loadApiKeys(projectId?: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('No authenticated user, skipping API keys load')
      apiKeysStore.set([])
      return
    }

    console.log('Loading API keys for project:', projectId || 'all projects')
    
    let query = supabase
      .from('project_api_keys')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', userId)
      .order('created_at', { ascending: false })

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error loading API keys:', error)
      return
    }

    console.log('Loaded API keys:', data)
    apiKeysStore.set(data || [])
  } catch (error) {
    console.error('Error loading API keys:', error)
  }
}

// Create a new API key for a project
export async function createApiKey(apiKeyData: CreateApiKeyData): Promise<{ success: boolean; data?: ApiKeyResponse; error?: string }> {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Creating API key:', apiKeyData)
    
    const { data, error } = await supabase.rpc('create_project_api_key', {
      p_project_id: apiKeyData.project_id,
      p_name: apiKeyData.name.trim()
    })

    if (error) {
      console.error('Error creating API key:', error)
      return { success: false, error: error.message }
    }

    console.log('Created API key:', data)
    if (data && data.length > 0) {
      // Reload API keys to get the updated list
      await loadApiKeys()
      return { 
        success: true, 
        data: {
          api_key: data[0].api_key,
          api_secret: data[0].api_secret,
          key_name: data[0].key_name,
          project_name: data[0].project_name
        }
      }
    }

    return { success: false, error: 'No data returned' }
  } catch (error) {
    console.error('Error creating API key:', error)
    return { success: false, error: error.message }
  }
}

// Toggle API key active status
export async function toggleApiKey(keyId: string, isActive: boolean) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Toggling API key:', keyId, 'to', isActive)
    
    const { data, error } = await supabase
      .from('project_api_keys')
      .update({ is_active: isActive })
      .eq('id', keyId)
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', userId)

    if (error) {
      console.error('Error toggling API key:', error)
      return { success: false, error: error.message }
    }

    console.log('Toggled API key:', data)
    if (data && data.length > 0) {
      apiKeysStore.update(keys =>
        keys.map(key =>
          key.id === keyId ? { ...key, is_active: isActive } : key
        )
      )
      return { success: true }
    }

    return { success: false, error: 'API key not found' }
  } catch (error) {
    console.error('Error toggling API key:', error)
    return { success: false, error: error.message }
  }
}

// Delete an API key
export async function deleteApiKey(keyId: string) {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.error('No authenticated user')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('Deleting API key:', keyId)
    
    const { error } = await supabase
      .from('project_api_keys')
      .delete()
      .eq('id', keyId)
      .eq('project_id', supabase
        .from('projects')
        .select('id')
        .eq('user_id', userId)
      )

    if (error) {
      console.error('Error deleting API key:', error)
      return { success: false, error: error.message }
    }

    console.log('Deleted API key:', keyId)
    apiKeysStore.update(keys => keys.filter(key => key.id !== keyId))
    
    return { success: true }
  } catch (error) {
    console.error('Error deleting API key:', error)
    return { success: false, error: error.message }
  }
}