<script lang="ts">
  import { onMount } from 'svelte'
  import AuthGuard from './lib/AuthGuard.svelte'
  import UserProfile from './lib/UserProfile.svelte'
  import Sidebar from './lib/Sidebar.svelte'
  import Dashboard from './lib/Dashboard.svelte'
  import ProjectManager from './lib/ProjectManager.svelte'
  import ApiKeysView from './lib/ApiKeysView.svelte'
  import LogsView from './lib/LogsView.svelte'
  import Analytics from './lib/Analytics.svelte'
  import Documentation from './lib/Documentation.svelte'
  import Settings from './lib/Settings.svelte'
  import LogIngestTester from './lib/LogIngestTester.svelte'
  import ChatQuestionTester from './lib/ChatQuestionTester.svelte'
  import { authStore } from './stores/authStore'
  
  let currentView = 'dashboard'
  let sidebarOpen = false
  
  function handleNavigation(event) {
    currentView = event.detail
    sidebarOpen = false // Close sidebar on mobile after navigation
  }
  
  function toggleSidebar() {
    sidebarOpen = !sidebarOpen
  }
</script>

<AuthGuard requireAuth={true}>
  <div class="app">
    <Sidebar {currentView} {sidebarOpen} on:navigate={handleNavigation} />
    
    <div class="main-content">
      <header class="app-header">
        <div class="header-content">
          <button class="mobile-menu-button" on:click={toggleSidebar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          
          <div class="header-title">
            {#if currentView === 'dashboard'}
              <h1>Dashboard</h1>
            {:else if currentView === 'projects'}
              <h1>Projects</h1>
            {:else if currentView === 'api-keys'}
              <h1>API Keys</h1>
            {:else if currentView === 'logs'}
              <h1>Activity Logs</h1>
            {:else if currentView === 'log-ingest-tester'}
              <h1>Log Ingest API Tester</h1>
            {:else if currentView === 'chat-tester'}
              <h1>Chat API Tester</h1>
            {:else if currentView === 'analytics'}
              <h1>Analytics</h1>
            {:else if currentView === 'documentation'}
              <h1>Documentation</h1>
            {:else if currentView === 'settings'}
              <h1>Settings</h1>
            {/if}
          </div>
          
          <UserProfile 
            on:profile={() => currentView = 'settings'}
            on:preferences={() => currentView = 'settings'}
            on:help={() => currentView = 'documentation'}
          />
        </div>
      </header>
      
      <main class="content">
        {#if currentView === 'dashboard'}
          <Dashboard />
        {:else if currentView === 'projects'}
          <ProjectManager />
        {:else if currentView === 'api-keys'}
          <ApiKeysView />
        {:else if currentView === 'logs'}
          <LogsView />
        {:else if currentView === 'log-ingest-tester'}
          <LogIngestTester />
        {:else if currentView === 'chat-tester'}
          <ChatQuestionTester />
        {:else if currentView === 'analytics'}
          <Analytics />
        {:else if currentView === 'documentation'}
          <Documentation />
        {:else if currentView === 'settings'}
          <Settings />
        {/if}
      </main>
    </div>
  </div>
</AuthGuard>

<style>
  .app {
    display: flex;
    min-height: 100vh;
    background: var(--color-scale-gray-950);
  }
  
  .main-content {
    flex: 1;
    margin-left: 280px;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }
  
  .app-header {
    background: var(--color-scale-gray-900);
    border-bottom: 1px solid var(--color-scale-gray-800);
    padding: 0 2rem;
    height: 64px;
    position: sticky;
    top: 0;
    z-index: 40;
    backdrop-filter: blur(8px);
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .mobile-menu-button {
    display: none;
    background: none;
    border: none;
    color: var(--color-scale-gray-400);
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 6px;
    transition: all 0.2s ease;
  }
  
  .mobile-menu-button:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-200);
  }
  
  .header-title h1 {
    margin: 0;
    color: var(--color-scale-gray-0);
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .content {
    flex: 1;
    overflow-y: auto;
    background: var(--color-scale-gray-950);
  }
  
  @media (max-width: 768px) {
    .main-content {
      margin-left: 0;
    }
    
    .mobile-menu-button {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .app-header {
      padding: 0 1rem;
    }
    
    .header-title h1 {
      font-size: 1.25rem;
    }
  }
</style>