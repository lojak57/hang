<script>
  import { goto } from '$app/navigation';
  import { user } from '$lib/stores/auth';

  let email = '';
  let password = '';
  let isSignUp = false;
  let error = null;

  async function handleSubmit() {
    error = null;
    
    // Simple mock authentication
    const mockUser = {
      id: crypto.randomUUID(),
      email: email,
      name: email.split('@')[0]
    };
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(mockUser));
    user.set(mockUser);
    
    // Redirect to home
    goto('/');
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        {isSignUp ? 'Create an account' : 'Sign in to your account'}
      </h2>
    </div>
    <form class="mt-8 space-y-6" on:submit|preventDefault={handleSubmit}>
      <div class="rounded-md shadow-sm -space-y-px">
        <div>
          <label for="email-address" class="sr-only">Email address</label>
          <input
            id="email-address"
            name="email"
            type="email"
            required
            bind:value={email}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
          />
        </div>
        <div>
          <label for="password" class="sr-only">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            bind:value={password}
            class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
          />
        </div>
      </div>

      {#if error}
        <div class="text-red-500 text-sm">{error}</div>
      {/if}

      <div>
        <button
          type="submit"
          class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isSignUp ? 'Sign up' : 'Sign in'}
        </button>
      </div>
    </form>

    <div class="text-center">
      <button
        class="text-indigo-600 hover:text-indigo-500"
        on:click={() => isSignUp = !isSignUp}
      >
        {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
      </button>
    </div>
  </div>
</div>
