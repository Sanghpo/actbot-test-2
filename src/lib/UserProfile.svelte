<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { authStore, signOut } from '../stores/authStore'
  
  const dispatch = createEventDispatcher()
  
  let showDropdown = false
  
  function toggleDropdown() {
    showDropdown = !showDropdown
  }
  
  function closeDropdown() {
    showDropdown = false
  }
  
  async function handleSignOut() {
    const result = await signOut()
    if (result.success) {
      closeDropdown()
      // Optionally show a success message or redirect
      console.log('Successfully signed out')
    } else {
      console.error('Sign out failed:', result.error)
      // Optionally show an error message
    }
  }
  
  function getDisplayName(user) {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    if (user?.phone) {
      return user.phone
    }
    return 'User'
  }
  
  function getInitials(user) {
    const name = getDisplayName(user)
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  function getUserEmail(user) {
    return user?.email || user?.phone || 'No contact info'
  }
  
  // Close dropdown when clicking outside
  function handleClickOutside(event) {
    if (!event.target.closest('.user-profile')) {
      closeDropdown()
    }
  }
  
  import { onMount } from 'svelte'
  onMount(() => {
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  })
</script>

{#if $authStore.user}
  <div class="user-profile">
    <button class="profile-button" on:click={toggleDropdown}>
      <div class="avatar">
        {#if $authStore.user.user_metadata?.avatar_url}
          <img src={$authStore.user.user_metadata.avatar_url} alt="Profile" />
        {:else}
          <span class="initials">{getInitials($authStore.user)}</span>
        {/if}
      </div>
      <span class="user-name">{getDisplayName($authStore.user)}</span>
      <svg 
        class="dropdown-arrow" 
        class:rotated={showDropdown}
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
      >
        <polyline points="6,9 12,15 18,9"></polyline>
      </svg>
    </button>
    
    {#if showDropdown}
      <div class="dropdown-menu">
        <div class="user-info">
          <div class="avatar-large">
            {#if $authStore.user.user_metadata?.avatar_url}
              <img src={$authStore.user.user_metadata.avatar_url} alt="Profile" />
            {:else}
              <span class="initials">{getInitials($authStore.user)}</span>
            {/if}
          </div>
          <div class="user-details">
            <div class="name">{getDisplayName($authStore.user)}</div>
            <div class="contact">{getUserEmail($authStore.user)}</div>
          </div>
        </div>
        
        <div class="menu-divider"></div>
        
        <div class="menu-items">
          <button class="menu-item" on:click={() => { dispatch('profile'); closeDropdown(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Profile Settings
          </button>
          
          <button class="menu-item" on:click={() => { dispatch('preferences'); closeDropdown(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="m12 1 1.68 3.36L17 6.64l-1.32 2.36L17 11.36 13.68 13 12 16.64 10.32 13 7 11.36l1.32-2.36L7 6.64l3.32-1.28L12 1z"></path>
            </svg>
            Account Settings
          </button>
          
          <button class="menu-item" on:click={() => { dispatch('help'); closeDropdown(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Help & Support
          </button>
        </div>
        
        <div class="menu-divider"></div>
        
        <button class="menu-item sign-out" on:click={handleSignOut}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16,17 21,12 16,7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          Sign Out
        </button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .user-profile {
    position: relative;
  }
  
  .profile-button {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 12px;
    padding: 0.5rem 1rem;
    color: var(--color-scale-gray-200);
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .profile-button:hover {
    background: var(--color-scale-gray-700);
    border-color: var(--color-scale-gray-600);
  }
  
  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-brand-500);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .initials {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-scale-gray-0);
  }
  
  .user-name {
    font-weight: 500;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .dropdown-arrow {
    transition: transform 0.2s ease;
    opacity: 0.7;
  }
  
  .dropdown-arrow.rotated {
    transform: rotate(180deg);
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: var(--color-scale-gray-900);
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--color-scale-gray-800);
    min-width: 280px;
    z-index: 1000;
    animation: dropdownSlideIn 0.2s ease-out;
  }
  
  @keyframes dropdownSlideIn {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  .user-info {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .avatar-large {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-brand-500);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .avatar-large img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-large .initials {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-scale-gray-0);
  }
  
  .user-details {
    flex: 1;
    min-width: 0;
  }
  
  .name {
    font-weight: 600;
    color: var(--color-scale-gray-0);
    margin-bottom: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .contact {
    font-size: 0.875rem;
    color: var(--color-scale-gray-400);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .menu-divider {
    height: 1px;
    background: var(--color-scale-gray-800);
    margin: 0 1rem;
  }
  
  .menu-items {
    padding: 0.5rem;
  }
  
  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    color: var(--color-scale-gray-300);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    font-size: 0.875rem;
    text-align: left;
  }
  
  .menu-item:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-0);
  }
  
  .menu-item.sign-out {
    color: #ef4444;
    margin-top: 0.5rem;
  }
  
  .menu-item.sign-out:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #f87171;
  }
  
  @media (max-width: 768px) {
    .user-name {
      display: none;
    }
    
    .dropdown-menu {
      right: -1rem;
      left: -1rem;
      min-width: auto;
    }
  }
</style>