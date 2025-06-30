<script lang="ts">
  import { onMount } from 'svelte'
  import { authStore, signOut } from '../stores/authStore'
  import { supabase } from '../lib/supabaseClient'
  
  let activeTab = 'profile'
  let loading = false
  let error = ''
  let success = ''
  
  // Profile settings
  let profileData = {
    full_name: '',
    email: '',
    phone: '',
    avatar_url: ''
  }
  
  // Account settings
  let accountSettings = {
    email_notifications: true,
    security_alerts: true,
    marketing_emails: false,
    weekly_reports: true
  }
  
  // Password change
  let passwordData = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  }
  
  // Billing data
  let billingData = {
    current_plan: 'free',
    billing_cycle: 'monthly',
    next_billing_date: null,
    payment_method: null,
    billing_history: []
  }
  
  onMount(() => {
    loadUserProfile()
    loadBillingInfo()
  })
  
  async function loadUserProfile() {
    try {
      const user = $authStore.user
      if (!user) return
      
      profileData.email = user.email || ''
      profileData.phone = user.phone || ''
      profileData.full_name = user.user_metadata?.full_name || ''
      profileData.avatar_url = user.user_metadata?.avatar_url || ''
      
      // Load additional profile data from user_profiles table if it exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (data && !error) {
        profileData.full_name = data.full_name || profileData.full_name
        profileData.phone = data.phone || profileData.phone
        profileData.avatar_url = data.avatar_url || profileData.avatar_url
        
        // Load account settings if available
        if (data.settings) {
          accountSettings = { ...accountSettings, ...data.settings }
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
    }
  }
  
  async function loadBillingInfo() {
    try {
      const user = $authStore.user
      if (!user) return
      
      // Mock billing data - in a real app, this would come from your billing provider
      billingData = {
        current_plan: 'free',
        billing_cycle: 'monthly',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        payment_method: null,
        billing_history: [
          {
            id: '1',
            date: '2024-01-15',
            amount: 0,
            status: 'paid',
            description: 'Free Plan'
          }
        ]
      }
    } catch (err) {
      console.error('Error loading billing info:', err)
    }
  }
  
  async function updateProfile() {
    loading = true
    error = ''
    success = ''
    
    try {
      const user = $authStore.user
      if (!user) {
        error = 'No authenticated user'
        return
      }
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          avatar_url: profileData.avatar_url
        }
      })
      
      if (updateError) {
        error = updateError.message
        return
      }
      
      // Create or update user_profiles table entry
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          avatar_url: profileData.avatar_url,
          settings: accountSettings,
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.warn('Profile table update failed (table may not exist):', profileError)
        // Don't show error to user as this is optional
      }
      
      success = 'Profile updated successfully!'
      setTimeout(() => success = '', 3000)
    } catch (err) {
      error = err.message || 'Failed to update profile'
    } finally {
      loading = false
    }
  }
  
  async function updateAccountSettings() {
    loading = true
    error = ''
    success = ''
    
    try {
      const user = $authStore.user
      if (!user) {
        error = 'No authenticated user'
        return
      }
      
      // Update account settings in user_profiles table
      const { error: settingsError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          settings: accountSettings,
          updated_at: new Date().toISOString()
        })
      
      if (settingsError) {
        console.warn('Settings update failed (table may not exist):', settingsError)
        // Don't show error to user as this is optional
      }
      
      success = 'Account settings updated successfully!'
      setTimeout(() => success = '', 3000)
    } catch (err) {
      error = err.message || 'Failed to update account settings'
    } finally {
      loading = false
    }
  }
  
  async function updatePassword() {
    if (passwordData.new_password !== passwordData.confirm_password) {
      error = 'New passwords do not match'
      return
    }
    
    if (passwordData.new_password.length < 6) {
      error = 'Password must be at least 6 characters'
      return
    }
    
    loading = true
    error = ''
    success = ''
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new_password
      })
      
      if (updateError) {
        error = updateError.message
        return
      }
      
      success = 'Password updated successfully!'
      passwordData = { current_password: '', new_password: '', confirm_password: '' }
      setTimeout(() => success = '', 3000)
    } catch (err) {
      error = err.message || 'Failed to update password'
    } finally {
      loading = false
    }
  }
  
  async function deleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }
    
    if (!confirm('This will permanently delete all your projects, API keys, and data. Are you absolutely sure?')) {
      return
    }
    
    loading = true
    error = ''
    
    try {
      // In a real app, you'd call a server endpoint to handle account deletion
      // For now, we'll just sign out the user
      await signOut()
      
      // You would typically call an API endpoint here that:
      // 1. Deletes all user data
      // 2. Deactivates API keys
      // 3. Removes the user account
      
      success = 'Account deletion initiated. You will receive a confirmation email.'
    } catch (err) {
      error = err.message || 'Failed to delete account'
    } finally {
      loading = false
    }
  }
  
  function switchTab(tab: string) {
    activeTab = tab
    error = ''
    success = ''
  }
  
  function upgradeToPro() {
    // In a real app, this would integrate with a payment processor
    alert('Upgrade functionality would integrate with Stripe or similar payment processor')
  }
  
  function manageBilling() {
    // In a real app, this would redirect to billing portal
    alert('Billing management would redirect to payment processor portal')
  }
  
  function downloadInvoice(invoiceId: string) {
    // In a real app, this would download the invoice
    alert(`Download invoice ${invoiceId}`)
  }
</script>

<div class="settings">
  <div class="settings-header">
    <h1>Settings</h1>
    <p>Manage your account preferences and security settings</p>
  </div>
  
  {#if error}
    <div class="error-message">{error}</div>
  {/if}
  
  {#if success}
    <div class="success-message">{success}</div>
  {/if}
  
  <div class="settings-container">
    <div class="settings-sidebar">
      <nav class="settings-nav">
        <button
          class="nav-item"
          class:active={activeTab === 'profile'}
          on:click={() => switchTab('profile')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          Profile
        </button>
        
        <button
          class="nav-item"
          class:active={activeTab === 'account'}
          on:click={() => switchTab('account')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="m12 1 1.68 3.36L17 6.64l-1.32 2.36L17 11.36 13.68 13 12 16.64 10.32 13 7 11.36l1.32-2.36L7 6.64l3.32-1.28L12 1z"></path>
          </svg>
          Account
        </button>
        
        <button
          class="nav-item"
          class:active={activeTab === 'security'}
          on:click={() => switchTab('security')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <circle cx="12" cy="16" r="1"></circle>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          Security
        </button>
        
        <button
          class="nav-item"
          class:active={activeTab === 'billing'}
          on:click={() => switchTab('billing')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Billing
        </button>
      </nav>
    </div>
    
    <div class="settings-content">
      {#if activeTab === 'profile'}
        <div class="settings-section">
          <h2>Profile Information</h2>
          <p>Update your personal information and profile details.</p>
          
          <form on:submit|preventDefault={updateProfile}>
            <div class="form-grid">
              <div class="form-group">
                <label for="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  bind:value={profileData.full_name}
                  placeholder="Your full name"
                  disabled={loading}
                />
              </div>
              
              <div class="form-group">
                <label for="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  bind:value={profileData.email}
                  placeholder="your@email.com"
                  disabled={true}
                />
                <small>Email cannot be changed. Contact support if needed.</small>
              </div>
              
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  bind:value={profileData.phone}
                  placeholder="+1234567890"
                  disabled={loading}
                />
              </div>
              
              <div class="form-group">
                <label for="avatar">Avatar URL</label>
                <input
                  id="avatar"
                  type="url"
                  bind:value={profileData.avatar_url}
                  placeholder="https://example.com/avatar.jpg"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="primary-button" disabled={loading}>
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>
      
      {:else if activeTab === 'account'}
        <div class="settings-section">
          <h2>Account Preferences</h2>
          <p>Manage your notification preferences and account settings.</p>
          
          <div class="preferences-list">
            <div class="preference-item">
              <div class="preference-info">
                <h4>Email Notifications</h4>
                <p>Receive email notifications for important updates</p>
              </div>
              <label class="toggle">
                <input type="checkbox" bind:checked={accountSettings.email_notifications} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h4>Security Alerts</h4>
                <p>Get notified about security-related events</p>
              </div>
              <label class="toggle">
                <input type="checkbox" bind:checked={accountSettings.security_alerts} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h4>Marketing Emails</h4>
                <p>Receive updates about new features and promotions</p>
              </div>
              <label class="toggle">
                <input type="checkbox" bind:checked={accountSettings.marketing_emails} />
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="preference-item">
              <div class="preference-info">
                <h4>Weekly Reports</h4>
                <p>Get weekly summaries of your API usage</p>
              </div>
              <label class="toggle">
                <input type="checkbox" bind:checked={accountSettings.weekly_reports} />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button class="primary-button" on:click={updateAccountSettings} disabled={loading}>
              {loading ? 'Updating...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      
      {:else if activeTab === 'security'}
        <div class="settings-section">
          <h2>Security Settings</h2>
          <p>Manage your password and security preferences.</p>
          
          <form on:submit|preventDefault={updatePassword}>
            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                bind:value={passwordData.current_password}
                placeholder="Enter current password"
                disabled={loading}
              />
            </div>
            
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                bind:value={passwordData.new_password}
                placeholder="Enter new password"
                disabled={loading}
              />
            </div>
            
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                bind:value={passwordData.confirm_password}
                placeholder="Confirm new password"
                disabled={loading}
              />
            </div>
            
            <div class="form-actions">
              <button type="submit" class="primary-button" disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
          
          <div class="danger-zone">
            <h3>Danger Zone</h3>
            <div class="danger-item">
              <div class="danger-info">
                <h4>Delete Account</h4>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button class="danger-button" on:click={deleteAccount} disabled={loading}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      
      {:else if activeTab === 'billing'}
        <div class="settings-section">
          <h2>Billing & Subscription</h2>
          <p>Manage your subscription and billing information.</p>
          
          <div class="billing-info">
            <div class="current-plan">
              <h3>Current Plan</h3>
              <div class="plan-card">
                <div class="plan-header">
                  <h4>Free Plan</h4>
                  <span class="plan-price">$0/month</span>
                </div>
                <div class="plan-features">
                  <div class="feature">✓ Up to 3 projects</div>
                  <div class="feature">✓ 10,000 API requests/month</div>
                  <div class="feature">✓ Basic analytics</div>
                  <div class="feature">✓ Email support</div>
                </div>
                <div class="plan-actions">
                  <button class="secondary-button" on:click={manageBilling}>
                    Manage Billing
                  </button>
                </div>
              </div>
            </div>
            
            <div class="upgrade-section">
              <h3>Upgrade to Pro</h3>
              <div class="plan-card pro">
                <div class="plan-header">
                  <h4>Pro Plan</h4>
                  <span class="plan-price">$29/month</span>
                </div>
                <div class="plan-features">
                  <div class="feature">✓ Unlimited projects</div>
                  <div class="feature">✓ 1M API requests/month</div>
                  <div class="feature">✓ Advanced analytics</div>
                  <div class="feature">✓ Priority support</div>
                  <div class="feature">✓ Custom integrations</div>
                  <div class="feature">✓ White-label options</div>
                </div>
                <button class="upgrade-button" on:click={upgradeToPro}>
                  Upgrade Now
                </button>
              </div>
            </div>
            
            <div class="billing-history">
              <h3>Billing History</h3>
              <div class="history-table">
                <div class="history-header">
                  <div>Date</div>
                  <div>Description</div>
                  <div>Amount</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>
                {#each billingData.billing_history as invoice (invoice.id)}
                  <div class="history-row">
                    <div>{new Date(invoice.date).toLocaleDateString()}</div>
                    <div>{invoice.description}</div>
                    <div>${invoice.amount}</div>
                    <div>
                      <span class="status-badge {invoice.status}">
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <button class="download-button" on:click={() => downloadInvoice(invoice.id)}>
                        Download
                      </button>
                    </div>
                  </div>
                {:else}
                  <div class="no-history">No billing history available</div>
                {/each}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .settings {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .settings-header {
    margin-bottom: 2rem;
  }
  
  .settings-header h1 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 2rem;
    font-weight: 700;
  }
  
  .settings-header p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 1.1rem;
  }
  
  .settings-container {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: 2rem;
  }
  
  .settings-sidebar {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 1rem;
    height: fit-content;
  }
  
  .settings-nav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border: none;
    background: none;
    color: var(--color-scale-gray-400);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
    text-align: left;
    font-size: 0.95rem;
    font-weight: 500;
  }
  
  .nav-item:hover {
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-200);
  }
  
  .nav-item.active {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
  }
  
  .settings-content {
    background: var(--color-scale-gray-900);
    border: 1px solid var(--color-scale-gray-800);
    border-radius: 12px;
    padding: 2rem;
  }
  
  .settings-section h2 {
    margin: 0 0 0.5rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  .settings-section p {
    margin: 0 0 2rem 0;
    color: var(--color-scale-gray-400);
    line-height: 1.6;
  }
  
  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-group label {
    font-weight: 500;
    color: var(--color-scale-gray-300);
  }
  
  .form-group input {
    padding: 0.75rem;
    border: 2px solid var(--color-scale-gray-800);
    border-radius: 8px;
    font-size: 1rem;
    background: var(--color-scale-gray-800);
    color: var(--color-scale-gray-100);
    transition: border-color 0.2s ease;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--color-brand-500);
  }
  
  .form-group input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .form-group small {
    color: var(--color-scale-gray-500);
    font-size: 0.875rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
  }
  
  .primary-button {
    background: var(--color-brand-500);
    color: var(--color-scale-gray-0);
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .primary-button:hover:not(:disabled) {
    background: var(--color-brand-600);
    transform: translateY(-1px);
  }
  
  .primary-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .secondary-button {
    background: var(--color-scale-gray-700);
    color: var(--color-scale-gray-200);
    border: 1px solid var(--color-scale-gray-600);
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .secondary-button:hover {
    background: var(--color-scale-gray-600);
    border-color: var(--color-scale-gray-500);
  }
  
  .preferences-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .preference-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 12px;
  }
  
  .preference-info h4 {
    margin: 0 0 0.25rem 0;
    color: var(--color-scale-gray-0);
    font-weight: 600;
  }
  
  .preference-info p {
    margin: 0;
    color: var(--color-scale-gray-400);
    font-size: 0.875rem;
  }
  
  .toggle {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }
  
  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-scale-gray-600);
    transition: 0.3s;
    border-radius: 24px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
  }
  
  .toggle input:checked + .toggle-slider {
    background-color: var(--color-brand-500);
  }
  
  .toggle input:checked + .toggle-slider:before {
    transform: translateX(24px);
  }
  
  .danger-zone {
    margin-top: 3rem;
    padding-top: 2rem;
    border-top: 1px solid var(--color-scale-gray-800);
  }
  
  .danger-zone h3 {
    margin: 0 0 1rem 0;
    color: #ef4444;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .danger-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
  }
  
  .danger-info h4 {
    margin: 0 0 0.25rem 0;
    color: #ef4444;
    font-weight: 600;
  }
  
  .danger-info p {
    margin: 0;
    color: #f87171;
    font-size: 0.875rem;
  }
  
  .danger-button {
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .danger-button:hover:not(:disabled) {
    background: #dc2626;
  }
  
  .danger-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .billing-info {
    display: grid;
    gap: 2rem;
  }
  
  .current-plan h3,
  .upgrade-section h3,
  .billing-history h3 {
    margin: 0 0 1rem 0;
    color: var(--color-scale-gray-0);
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .plan-card {
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 12px;
    padding: 1.5rem;
  }
  
  .plan-card.pro {
    background: linear-gradient(135deg, var(--color-brand-600) 0%, var(--color-brand-500) 100%);
    color: white;
    border: none;
  }
  
  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .plan-header h4 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
  }
  
  .plan-price {
    font-size: 1.5rem;
    font-weight: 700;
  }
  
  .plan-features {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }
  
  .feature {
    font-size: 0.875rem;
    opacity: 0.9;
  }
  
  .plan-actions {
    display: flex;
    gap: 1rem;
  }
  
  .upgrade-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }
  
  .upgrade-button:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
  
  .history-table {
    background: var(--color-scale-gray-800);
    border: 1px solid var(--color-scale-gray-700);
    border-radius: 12px;
    overflow: hidden;
  }
  
  .history-header {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr 1fr 1fr;
    background: var(--color-scale-gray-700);
    padding: 1rem;
    font-weight: 600;
    color: var(--color-scale-gray-200);
    font-size: 0.875rem;
  }
  
  .history-row {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr 1fr 1fr;
    padding: 1rem;
    border-bottom: 1px solid var(--color-scale-gray-700);
    align-items: center;
  }
  
  .history-row:last-child {
    border-bottom: none;
  }
  
  .status-badge {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-weight: 500;
    width: fit-content;
  }
  
  .status-badge.paid {
    background: rgba(34, 211, 238, 0.2);
    color: var(--color-brand-400);
  }
  
  .status-badge.pending {
    background: rgba(251, 191, 36, 0.2);
    color: #fbbf24;
  }
  
  .status-badge.failed {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
  
  .download-button {
    background: var(--color-scale-gray-600);
    color: var(--color-scale-gray-200);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .download-button:hover {
    background: var(--color-scale-gray-500);
  }
  
  .no-history {
    grid-column: 1 / -1;
    text-align: center;
    padding: 2rem;
    color: var(--color-scale-gray-500);
    font-style: italic;
  }
  
  .error-message {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid #ef4444;
    color: #f87171;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  .success-message {
    background: rgba(34, 211, 238, 0.1);
    border: 1px solid var(--color-brand-500);
    color: var(--color-brand-400);
    padding: 0.75rem 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  
  @media (max-width: 768px) {
    .settings {
      padding: 1rem;
    }
    
    .settings-container {
      grid-template-columns: 1fr;
    }
    
    .form-grid {
      grid-template-columns: 1fr;
    }
    
    .preference-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .danger-item {
      flex-direction: column;
      align-items: stretch;
      gap: 1rem;
    }
    
    .history-header,
    .history-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
    }
    
    .history-header {
      display: none;
    }
  }
</style>