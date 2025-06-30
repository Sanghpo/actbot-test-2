<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import LoginForm from './LoginForm.svelte'
  import SignupForm from './SignupForm.svelte'
  
  export let isOpen = false
  export let initialMode: 'login' | 'signup' = 'signup'
  
  const dispatch = createEventDispatcher()
  
  let currentMode = initialMode
  let prefilledEmail = ''
  
  function closeModal() {
    dispatch('close')
  }
  
  function switchMode(mode: 'login' | 'signup', data?: any) {
    currentMode = mode
    
    if (mode === 'signup' && data?.email) {
      prefilledEmail = data.email
    } else {
      prefilledEmail = ''
    }
  }
  
  function handleAuthSuccess(event) {
    // Close modal regardless of whether email verification is needed
    // The AuthGuard will handle showing the verification message
    closeModal()
  }
  
  function handleSwitchToSignup(event) {
    if (event.detail?.email) {
      switchMode('signup', { email: event.detail.email })
    } else {
      switchMode('signup')
    }
  }
</script>

{#if isOpen}
  <div class="auth-overlay" on:click={closeModal}>
    <div class="auth-container" on:click|stopPropagation>
      <!-- Left Side - Graphics -->
      <div class="left-side">
        <div class="cube-container">
          <div class="cube-glow"></div>
        </div>
      </div>
      
      <!-- Right Side - Auth Form -->
      <div class="right-side">
        <div class="brand-icon">
          <div class="icon-grid">
            <div class="icon-dot"></div>
            <div class="icon-dot"></div>
            <div class="icon-dot"></div>
            <div class="icon-dot"></div>
          </div>
        </div>
        
        <div class="auth-content">
          {#if currentMode === 'login'}
            <LoginForm 
              on:switchToSignup={handleSwitchToSignup}
              on:success={handleAuthSuccess}
            />
          {:else}
            <SignupForm 
              prefilledEmail={prefilledEmail}
              on:switchToLogin={() => switchMode('login')}
              on:success={handleAuthSuccess}
            />
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .auth-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #000000;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 0;
  }
  
  .auth-container {
    width: 100vw;
    height: 100vh;
    display: flex;
    background: #000000;
  }
  
  .left-side {
    flex: 1;
    background: linear-gradient(135deg, var(--color-brand-800) 0%, var(--color-brand-600) 50%, var(--color-brand-500) 100%);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  
  .cube-container {
    position: relative;
    width: 200px;
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .cube-glow {
    width: 120px;
    height: 120px;
    background: linear-gradient(45deg, var(--color-brand-400), var(--color-brand-300), var(--color-brand-500), var(--color-special-orange-400), var(--color-special-orange-500));
    border-radius: 20px;
    position: relative;
    animation: float 6s ease-in-out infinite;
    box-shadow: 
      0 0 60px rgba(34, 211, 238, 0.4),
      0 0 100px rgba(34, 211, 238, 0.3),
      0 0 140px rgba(34, 211, 238, 0.2);
  }
  
  .cube-glow::before {
    content: '';
    position: absolute;
    top: -10px;
    left: -10px;
    right: -10px;
    bottom: -10px;
    background: linear-gradient(45deg, var(--color-brand-400), var(--color-brand-300), var(--color-brand-500), var(--color-special-orange-400), var(--color-special-orange-500));
    border-radius: 25px;
    z-index: -1;
    filter: blur(20px);
    opacity: 0.7;
    animation: pulse 4s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotateY(0deg); }
    50% { transform: translateY(-20px) rotateY(180deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
  
  .right-side {
    flex: 1;
    background: #000000;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow-y: auto;
  }
  
  .brand-icon {
    position: absolute;
    top: 2rem;
    right: 2rem;
  }
  
  .icon-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    width: 24px;
    height: 24px;
  }
  
  .icon-dot {
    width: 8px;
    height: 8px;
    background: var(--color-brand-500);
    border-radius: 2px;
  }
  
  .auth-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 400px;
    margin: 0 auto;
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .auth-container {
      flex-direction: column;
    }
    
    .left-side {
      flex: 0 0 200px;
    }
    
    .right-side {
      flex: 1;
      padding: 2rem 1.5rem;
    }
    
    .brand-icon {
      top: 1rem;
      right: 1rem;
    }
  }
</style>