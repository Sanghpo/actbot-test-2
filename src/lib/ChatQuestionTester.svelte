<script lang="ts">
  import { onMount } from 'svelte'
  import { projectStore, apiKeysStore, loadProjects, loadApiKeys } from '../stores/projectStore'
  import { sendChatQuestion } from '../stores/chatService'
  import type { ChatMessage } from '../types/chat'
  
  let selectedProject = ''
  let selectedApiKey = ''
  let clientUuid = ''
  let messages: ChatMessage[] = []
  let currentMessage = ''
  let loading = false
  let error = ''
  
  onMount(() => {
    loadProjects()
    loadApiKeys()
  })
  
  $: filteredApiKeys = $apiKeysStore.filter(key => 
    !selectedProject || key.project_id === getProjectIdFromPublicId(selectedProject)
  )
  
  $: selectedApiKeyData = $apiKeysStore.find(key => key.id === selectedApiKey)
  
  function getProjectIdFromPublicId(publicId: string): string {
    const project = $projectStore.find(p => p.public_id === publicId)
    return project?.id || ''
  }
  
  async function sendMessage() {
    if (!currentMessage.trim() || !selectedProject || !selectedApiKey || !clientUuid.trim()) {
      error = 'Please fill in all fields and enter a message'
      return
    }
    
    if (!selectedApiKeyData) {
      error = 'Selected API key not found'
      return
    }
    
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: currentMessage.trim(),
      timestamp: new Date().toISOString()
    }
    
    messages = [...messages, userMessage]
    const question = currentMessage.trim()
    currentMessage = ''
    loading = true
    error = ''
    
    try {
      const response = await sendChatQuestion(
        selectedApiKeyData.api_key,
        selectedApiKeyData.api_secret,
        selectedProject, // This is now the public_id
        clientUuid.trim(),
        question
      )
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.success 
          ? response.answer || 'I received your question but couldn\'t generate a response.'
          : response.error || 'Sorry, I encountered an error processing your question.',
        timestamp: new Date().toISOString()
      }
      
      messages = [...messages, assistantMessage]
      
      if (!response.success) {
        error = response.error || 'Failed to get response'
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered a technical error. Please try again.',
        timestamp: new Date().toISOString()
      }
      
      messages = [...messages, errorMessage]
      error = err.message || 'Failed to send message'
    } finally {
      loading = false
    }
  }
  
  function clearChat() {
    messages = []
    error = ''
  }
  
  function formatTime(timestamp: string) {
    return new Date(timestamp).toLocaleTimeString()
  }
  
  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }
  
  function getProjectName(publicId: string) {
    const project = $projectStore.find(p => p.public_id === publicId)
    return project?.name || 'Unknown Project'
  }
</script>

<div class="chat-tester">
  <div class="chat-header">
    <h1>Chat Question API Tester</h1>
    <p>Test the chat-question API endpoint with your projects and API keys</p>
  </div>
  
  <div class="chat-config">
    <div class="config-section">
      <h3>Configuration</h3>
      <div class="config-grid">
        <div class="config-field">
          <label for="project">Project</label>
          <select id="project" bind:value={selectedProject}>
            <option value="">Select a project</option>
            {#each $projectStore as project (project.id)}
              <option value={project.public_id}>{project.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="config-field">
          <label for="apiKey">API Key</label>
          <select id="apiKey" bind:value={selectedApiKey} disabled={!selectedProject}>
            <option value="">Select an API key</option>
            {#each filteredApiKeys as apiKey (apiKey.id)}
              <option value={apiKey.id}>{apiKey.name}</option>
            {/each}
          </select>
        </div>
        
        <div class="config-field">
          <label for="clientUuid">Client UUID</label>
          <input
            id="clientUuid"
            type="text"
            bind:value={clientUuid}
            placeholder="e.g., user-123"
          />
        </div>
      </div>
      
      {#if selectedProject && selectedApiKey && clientUuid}
        <div class="config-summary">
          <p><strong>Project:</strong> {getProjectName(selectedProject)} ({selectedProject})</p>
          <p><strong>API Key:</strong> {selectedApiKeyData?.name}</p>
          <p><strong>Client:</strong> {clientUuid}</p>
          <p><strong>Endpoint:</strong> /functions/v1/chat-question</p>
        </div>
      {/if}
    </div>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  <div class="chat-container">
    <div class="chat-messages">
      {#if messages.length === 0}
        <div class="empty-chat">
          <div class="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
          </div>
          <h3>Start testing the chat API</h3>
          <p>Configure your project settings above and ask questions to test the chat-question API endpoint.</p>
        </div>
      {:else}
        {#each messages as message (message.id)}
          <div class="message" class:user={message.type === 'user'} class:assistant={message.type === 'assistant'}>
            <div class="message-content">
              <div class="message-text">{message.content}</div>
              <div class="message-time">{formatTime(message.timestamp)}</div>
            </div>
          </div>
        {/each}
        
        {#if loading}
          <div class="message assistant">
            <div class="message-content">
              <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
    
    <div class="chat-input">
      <div class="input-container">
        <textarea
          bind:value={currentMessage}
          on:keypress={handleKeyPress}
          placeholder="Ask a question to test the chat API..."
          disabled={loading || !selectedProject || !selectedApiKey || !clientUuid}
          rows="1"
        ></textarea>
        <div class="input-actions">
          {#if messages.length > 0}
            <button class="clear-button" on:click={clearChat} disabled={loading}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3,6 5,6 21,6"></polyline>
                <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"></path>
              </svg>
            </button>
          {/if}
          <button 
            class="send-button" 
            on:click={sendMessage} 
            disabled={loading || !currentMessage.trim() || !selectedProject || !selectedApiKey || !clientUuid}
          >
            {#if loading}
              <div class="spinner"></div>
            {:else}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
              </svg>
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chat-tester {
    padding: 2rem;
    max-width: 1000px;
    margin: 0 auto;
    height: calc(100vh - 64px);
    display: flex;
    flex-direction: column;
  }
  
  .chat-header {
    margin-bottom: 2rem;
  }
  
  .chat-header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 600;
  }
  
  .chat-header p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.125rem;
  }
  
  .chat-config {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .config-section h3 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.125rem;
    font-weight: 600;
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
  }
  
  .config-field label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
  }
  
  .config-field select,
  .config-field input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    transition: border-color 0.2s ease;
  }
  
  .config-field select:focus,
  .config-field input:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .config-summary {
    background: var(--color-scale-gray-800);
    border-radius: 8px;
    padding: 1rem;
    border-left: 4px solid var(--color-brand-500);
  }
  
  .config-summary p {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-300);
    font-size: 0.875rem;
  }
  
  .config-summary p:last-child {
    margin-bottom: 0;
  }
  
  .chat-container {
    flex: 1;
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .empty-chat {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--color-scale-gray-500);
  }
  
  .empty-icon {
    margin-bottom: 1rem;
    color: var(--color-scale-gray-600);
  }
  
  .empty-chat h3 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-400);
    font-size: 1.25rem;
  }
  
  .empty-chat p {
    margin: 0;
    font-size: 0.875rem;
  }
  
  .message {
    display: flex;
    max-width: 80%;
  }
  
  .message.user {
    align-self: flex-end;
    margin-left: auto;
  }
  
  .message.assistant {
    align-self: flex-start;
  }
  
  .message-content {
    background: var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1rem;
    position: relative;
  }
  
  .message.user .message-content {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
  }
  
  .message-text {
    margin-bottom: 0.5rem;
    line-height: 1.5;
    white-space: pre-wrap;
  }
  
  .message-time {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  
  .typing-indicator {
    display: flex;
    gap: 0.25rem;
    align-items: center;
  }
  
  .typing-dot {
    width: 8px;
    height: 8px;
    background: var(--color-scale-gray-500);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }
  
  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .chat-input {
    border-top: 1px solid var(--color-scale-gray-800);
    padding: 1rem;
  }
  
  .input-container {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
  }
  
  .input-container textarea {
    flex: 1;
    padding: 0.75rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    resize: none;
    min-height: 44px;
    max-height: 120px;
    transition: border-color 0.2s ease;
  }
  
  .input-container textarea:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .input-container textarea:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .input-actions {
    display: flex;
    gap: 0.5rem;
  }
  
  .clear-button,
  .send-button {
    width: 44px;
    height: 44px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }
  
  .clear-button {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-300);
  }
  
  .clear-button:hover:not(:disabled) {
    background: var(--color-scale-gray-600);
    color: var(--color-scale-gray-200);
  }
  
  .send-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
  }
  
  .send-button:hover:not(:disabled) {
    background: var(--color-brand-600);
    transform: translateY(-1px);
  }
  
  .send-button:disabled,
  .clear-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .chat-tester {
      padding: 1rem;
    }
    
    .config-grid {
      grid-template-columns: 1fr;
    }
    
    .message {
      max-width: 90%;
    }
  }
</style>