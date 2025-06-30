<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { signUpWithEmail, signInWithGoogle } from '../stores/authStore'
  
  const dispatch = createEventDispatcher()
  
  export let prefilledEmail = ''
  
  let email = prefilledEmail
  let password = ''
  let fullName = ''
  let loading = false
  let error = ''
  let acceptTerms = false
  let showPassword = false
  
  function switchToLogin() {
    dispatch('switchToLogin')
  }
  
  async function handleEmailSignup() {
    if (!fullName || !email || !password) {
      error = 'Please fill in all fields'
      return
    }
    
    if (password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }
    
    if (!acceptTerms) {
      error = 'Please accept the terms and conditions'
      return
    }
    
    loading = true
    error = ''
    
    const result = await signUpWithEmail(email, password, fullName)
    
    if (result.success) {
      dispatch('success', { needsEmailVerification: result.needsEmailVerification })
    } else {
      error = result.error || 'Failed to sign up'
    }
    
    loading = false
  }
  
  async function handleGoogleSignup() {
    if (!acceptTerms) {
      error = 'Please accept the terms and conditions'
      return
    }
    
    loading = true
    error = ''
    
    const result = await signInWithGoogle()
    
    if (!result.success) {
      error = result.error || 'Failed to sign up with Google'
      loading = false
    }
  }

  function clearErrorOnInput() {
    if (error) {
      error = ''
    }
  }

  $: if (prefilledEmail) {
    email = prefilledEmail
  }
  
  function togglePasswordVisibility() {
    showPassword = !showPassword
  }
</script>

<div class="signup-form">
  <div class="form-header">
    <h2>Create an Account</h2>
    <p>Already have an account? 
      <button class="header-link" on:click={switchToLogin}>Log in</button>
    </p>
  </div>
  
  {#if error}
    <div class="error-message">
      {error}
    </div>
  {/if}
  
  <form on:submit|preventDefault={handleEmailSignup}>
    <div class="form-group">
      <label for="fullName">Your Name</label>
      <input
        id="fullName"
        type="text"
        bind:value={fullName}
        on:input={clearErrorOnInput}
        placeholder="Your Name"
        required
        disabled={loading}
      />
    </div>
    
    <div class="form-group">
      <label for="email">Email address</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        on:input={clearErrorOnInput}
        placeholder="Email address"
        required
        disabled={loading}
      />
    </div>
    
    <div class="form-group">
      <label for="password">Password</label>
      <div class="password-input-container">
        {#if showPassword}
          <input
            id="password"
            type="text"
            bind:value={password}
            on:input={clearErrorOnInput}
            placeholder="Password"
            required
            disabled={loading}
          />
        {:else}
          <input
            id="password"
            type="password"
            bind:value={password}
            on:input={clearErrorOnInput}
            placeholder="Password"
            required
            disabled={loading}
          />
        {/if}
        <button
          type="button"
          class="password-toggle"
          on:click={togglePasswordVisibility}
          disabled={loading}
        >
          {#if showPassword}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          {:else}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          {/if}
        </button>
      </div>
    </div>
    
    <div class="checkbox-group">
      <label class="checkbox-label">
        <input
          type="checkbox"
          bind:checked={acceptTerms}
          disabled={loading}
        />
        <span class="checkmark"></span>
        I agree to the <a href="/terms" target="_blank">Terms and Privacy policy</a>
      </label>
    </div>
    
    <button
      type="submit"
      class="submit-button"
      disabled={loading}
    >
      {#if loading}
        <div class="spinner"></div>
        Creating account...
      {:else}
        Create Account
      {/if}
    </button>
  </form>
  
  <div class="divider">
    <span>Or</span>
  </div>
  
  <button
    class="google-button"
    on:click={handleGoogleSignup}
    disabled={loading}
  >
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Sign up with Google
  </button>
</div>

<style>
  .signup-form {
    width: 100%;
  }
  
  .form-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .form-header h2 {
    margin: 0 0 0.5rem 0;
    color: #ffffff;
    font-size: 1.75rem;
    font-weight: 700;
  }
  
  .form-header p {
    margin: 0;
    color: #9ca3af;
    font-size: 0.875rem;
  }
  
  .header-link {
    background: none;
    border: none;
    color: var(--color-brand-400);
    cursor: pointer;
    font-weight: 500;
    text-decoration: underline;
    font-size: 0.875rem;
  }
  
  .header-link:hover {
    color: var(--color-brand-300);
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #ffffff;
    font-size: 0.875rem;
  }
  
  .form-group input {
    width: 100%;
    padding: 1rem;
    border: 2px solid var(--color-scale-gray-700);
    border-radius: 12px;
    font-size: 1rem;
    transition: border-color 0.2s ease;
    background: var(--color-scale-gray-800);
    color: #ffffff;
  }
  
  .form-group input::placeholder {
    color: #9ca3af;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--color-brand-500);
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
  }
  
  .form-group input:disabled {
    background: var(--color-scale-gray-900);
    cursor: not-allowed;
  }
  
  .password-input-container {
    position: relative;
  }
  
  .password-toggle {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #9ca3af;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .password-toggle:hover {
    color: #ffffff;
  }
  
  .checkbox-group {
    margin-bottom: 1.5rem;
  }
  
  .checkbox-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    cursor: pointer;
    font-size: 0.875rem;
    line-height: 1.5;
    color: #9ca3af;
  }
  
  .checkbox-label input[type="checkbox"] {
    display: none;
  }
  
  .checkmark {
    width: 18px;
    height: 18px;
    border: 2px solid var(--color-scale-gray-600);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    flex-shrink: 0;
    margin-top: 1px;
    background: transparent;
  }
  
  .checkbox-label input[type="checkbox"]:checked + .checkmark {
    background: var(--color-brand-500);
    border-color: var(--color-brand-500);
  }
  
  .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
    content: '✓';
    color: white;
    font-size: 12px;
    font-weight: bold;
  }
  
  .checkbox-label a {
    color: var(--color-brand-400);
    text-decoration: underline;
  }
  
  .checkbox-label a:hover {
    color: var(--color-brand-300);
  }
  
  .submit-button {
    width: 100%;
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 12px;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .submit-button:hover:not(:disabled) {
    background: var(--color-brand-600);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
  }
  
  .submit-button:disabled {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-400);
    cursor: not-allowed;
    transform: none;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .divider {
    text-align: center;
    margin: 1.5rem 0;
    position: relative;
  }
  
  .divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: var(--color-scale-gray-700);
  }
  
  .divider span {
    background: #000000;
    padding: 0 1rem;
    color: #9ca3af;
    font-size: 0.875rem;
  }
  
  .google-button {
    width: 100%;
    background: var(--color-scale-gray-800);
    color: #ffffff;
    border: 2px solid var(--color-scale-gray-700);
    border-radius: 12px;
    padding: 1rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  
  .google-button:hover:not(:disabled) {
    border-color: var(--color-scale-gray-600);
    background: var(--color-scale-gray-700);
    box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  }
  
  .google-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-size: 0.875rem;
  }
</style>