<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, initializeAuth, resendEmailVerification } from '../stores/authStore'
  import AuthModal from './AuthModal.svelte'
  
  export let requireAuth = true
  
  let showAuthModal = false
  let authModalMode: 'login' | 'signup' = 'login'
  let resendingEmail = false
  let resendSuccess = ''
  let resendError = ''
  
  onMount(() => {
    initializeAuth()
  })
  
  function openAuthModal(mode: 'login' | 'signup' = 'login') {
    authModalMode = mode
    showAuthModal = true
  }
  
  function closeAuthModal() {
    showAuthModal = false
  }
  
  async function handleResendVerification() {
    resendingEmail = true
    resendError = ''
    resendSuccess = ''
    
    const result = await resendEmailVerification()
    
    if (result.success) {
      resendSuccess = result.message || 'Verification email sent!'
      setTimeout(() => resendSuccess = '', 5000)
    } else {
      resendError = result.error || 'Failed to send verification email'
      setTimeout(() => resendError = '', 5000)
    }
    
    resendingEmail = false
  }
  
  // Show auth modal if user is not authenticated and auth is required
  $: if (requireAuth && !$authStore.loading && !$authStore.user && !$authStore.needsEmailVerification && !showAuthModal) {
    openAuthModal('login')
  }
</script>

{#if $authStore.loading}
  <div class="auth-loading">
    <div class="loading-spinner">
      <div class="spinner"></div>
    </div>
    <p>Loading...</p>
  </div>
{:else if requireAuth && !$authStore.user && $authStore.needsEmailVerification}
  <div class="email-verification">
    <div class="verification-prompt">
      <div class="verification-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
          <polyline points="22,6 12,13 2,6"></polyline>
        </svg>
      </div>
      
      <h2>Check Your Email</h2>
      <p>We've sent a verification link to your email address. Please click the link in the email to verify your account and complete the signup process.</p>
      
      <div class="verification-actions">
        <button 
          class="resend-button" 
          on:click={handleResendVerification}
          disabled={resendingEmail}
        >
          {#if resendingEmail}
            <div class="spinner small"></div>
            Sending...
          {:else}
            Resend Email
          {/if}
        </button>
        
        <button 
          class="back-button" 
          on:click={() => openAuthModal('login')}
        >
          Back to Sign In
        </button>
      </div>
      
      {#if resendSuccess}
        <div class="success-message">{resendSuccess}</div>
      {/if}
      
      {#if resendError}
        <div class="error-message">{resendError}</div>
      {/if}
      
      <div class="help-text">
        <p>Didn't receive the email? Check your spam folder or try resending.</p>
      </div>
    </div>
  </div>
{:else if requireAuth && !$authStore.user}
  <div class="auth-required">
    <div class="auth-prompt">
      <h2>Welcome to SaaS Platform</h2>
      <p>Please sign in to access your dashboard and start managing your projects.</p>
      
      <div class="auth-buttons">
        <button class="primary-button" on:click={() => openAuthModal('login')}>
          Sign In
        </button>
        <button class="secondary-button" on:click={() => openAuthModal('signup')}>
          Create Account
        </button>
      </div>
    </div>
  </div>
{:else}
  <slot />
{/if}

<AuthModal 
  isOpen={showAuthModal} 
  initialMode={authModalMode}
  on:close={closeAuthModal}
/>

<style>
  .auth-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #000000;
    color: white;
    text-align: center;
  }
  
  .loading-spinner {
    margin-bottom: 1rem;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .spinner.small {
    width: 16px;
    height: 16px;
    border-width: 2px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .email-verification {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #000000;
    padding: 2rem;
  }
  
  .verification-prompt {
    background: #1a1a1a;
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    max-width: 500px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
  }
  
  .verification-icon {
    margin-bottom: 2rem;
    color: #3b82f6;
  }
  
  .verification-prompt h2 {
    margin: 0 0 1rem 0;
    color: #ffffff;
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .verification-prompt p {
    margin: 0 0 2rem 0;
    color: #9ca3af;
    line-height: 1.6;
  }
  
  .verification-actions {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }
  
  .resend-button {
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  
  .resend-button:hover:not(:disabled) {
    background: #2563eb;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .resend-button:disabled {
    background: #555;
    color: #999;
    cursor: not-allowed;
    transform: none;
  }
  
  .back-button {
    background: transparent;
    color: #9ca3af;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .back-button:hover {
    border-color: #555;
    color: #ffffff;
    background: #1a1a1a;
  }
  
  .success-message {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .error-message {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
  
  .help-text {
    border-top: 1px solid #333;
    padding-top: 1.5rem;
  }
  
  .help-text p {
    margin: 0;
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .auth-required {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: #000000;
    padding: 2rem;
  }
  
  .auth-prompt {
    background: #1a1a1a;
    border-radius: 16px;
    padding: 3rem 2rem;
    text-align: center;
    max-width: 400px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    border: 1px solid #333;
  }
  
  .auth-prompt h2 {
    margin: 0 0 1rem 0;
    color: #ffffff;
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .auth-prompt p {
    margin: 0 0 2rem 0;
    color: #9ca3af;
    line-height: 1.6;
  }
  
  .auth-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .primary-button {
    background: #ffffff;
    color: #000000;
    border: none;
    border-radius: 8px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .primary-button:hover {
    background: #f3f4f6;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
  }
  
  .secondary-button {
    background: transparent;
    color: #ffffff;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .secondary-button:hover {
    border-color: #555;
    background: #1a1a1a;
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  }
  
  @media (max-width: 768px) {
    .auth-required,
    .email-verification {
      padding: 1rem;
    }
    
    .auth-prompt,
    .verification-prompt {
      padding: 2rem 1.5rem;
    }
  }
</style>