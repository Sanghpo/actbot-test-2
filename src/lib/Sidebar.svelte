<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  
  export let currentView = 'dashboard'
  export let sidebarOpen = false
  
  const dispatch = createEventDispatcher()
  
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
      </svg>`
    },
    {
      id: 'projects',
      label: 'Projects',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>`
    },
    {
      id: 'api-keys',
      label: 'API Keys',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <circle cx="12" cy="16" r="1"></circle>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>`
    },
    {
      id: 'logs',
      label: 'Activity Logs',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
      </svg>`
    },
    {
      id: 'log-ingest-tester',
      label: 'Log Ingest Tester',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17,8 12,3 7,8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>`
    },
    {
      id: 'chat-tester',
      label: 'Chat API Tester',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <path d="M8 9h8M8 13h6"></path>
      </svg>`
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M3 3v18h18"></path>
        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"></path>
      </svg>`
    },
    {
      id: 'documentation',
      label: 'Documentation',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>`
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="m12 1 1.68 3.36L17 6.64l-1.32 2.36L17 11.36 13.68 13 12 16.64 10.32 13 7 11.36l1.32-2.36L7 6.64l3.32-1.28L12 1z"></path>
      </svg>`
    }
  ]
  
  function selectMenuItem(itemId: string) {
    dispatch('navigate', itemId)
  }
</script>

<aside class="sidebar" class:open={sidebarOpen}>
  <div class="sidebar-header">
    <div class="logo">
      <div class="logo-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="8" height="8" rx="2" fill="var(--color-brand-500)"/>
          <rect x="13" y="3" width="8" height="8" rx="2" fill="var(--color-brand-400)"/>
          <rect x="3" y="13" width="8" height="8" rx="2" fill="var(--color-brand-600)"/>
          <rect x="13" y="13" width="8" height="8" rx="2" fill="var(--color-brand-300)"/>
        </svg>
      </div>
      <span class="logo-text">SaaS Platform</span>
    </div>
  </div>
  
  <nav class="sidebar-nav">
    <ul class="nav-list">
      {#each menuItems as item (item.id)}
        <li class="nav-item">
          <button
            class="nav-link"
            class:active={currentView === item.id}
            on:click={() => selectMenuItem(item.id)}
          >
            <span class="nav-icon">{@html item.icon}</span>
            <span class="nav-label">{item.label}</span>
          </button>
        </li>
      {/each}
    </ul>
  </nav>
  
  <div class="sidebar-footer">
    <div class="upgrade-card">
      <div class="upgrade-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"></polygon>
        </svg>
      </div>
      <div class="upgrade-content">
        <h4>Upgrade to Pro</h4>
        <p>Unlock unlimited projects and advanced features</p>
        <button class="upgrade-button">Upgrade Now</button>
      </div>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    width: 280px;
    height: 100vh;
    background: var(--color-scale-gray-900);
    border-right: 1px solid var(--color-scale-gray-800);
    display: flex;
    flex-direction: column;
    position: fixed;
    left: 0;
    top: 0;
    z-index: 50;
    transition: transform 0.3s ease;
  }
  
  .sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--color-scale-gray-800);
  }
  
  .logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .logo-text {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-scale-gray-0);
  }
  
  .sidebar-nav {
    flex: 1;
    padding: 1rem 0;
    overflow-y: auto;
  }
  
  .nav-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  .nav-item {
    margin: 0;
  }
  
  .nav-link {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    color: var(--color-scale-gray-400);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 0;
  }
  
  .nav-link:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-200);
  }
  
  .nav-link.active {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
  }
  
  .nav-link.active:hover {
    background: var(--color-brand-600);
  }
  
  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .nav-label {
    font-weight: 500;
  }
  
  .sidebar-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--color-scale-gray-800);
  }
  
  .upgrade-card {
    background: linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%);
    border-radius: 12px;
    padding: 1.5rem;
    color: var(--color-scale-gray-0);
    position: relative;
    overflow: hidden;
  }
  
  .upgrade-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
    pointer-events: none;
  }
  
  .upgrade-icon {
    margin-bottom: 0.75rem;
    opacity: 0.9;
  }
  
  .upgrade-content h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    font-weight: 600;
  }
  
  .upgrade-content p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    opacity: 0.9;
    line-height: 1.4;
  }
  
  .upgrade-button {
    background: rgba(255, 255, 255, 0.2);
    color: var(--color-scale-gray-0);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    width: 100%;
  }
  
  .upgrade-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }
  
  @media (max-width: 768px) {
    .sidebar {
      transform: translateX(-100%);
    }
    
    .sidebar.open {
      transform: translateX(0);
    }
  }
</style>