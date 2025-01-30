<script>
  // Updated: 2025-01-29 - Trigger deployment
  import '../app.css';
  import { currentUser } from '$lib/stores/currentUser';

  let user;
  currentUser.subscribe(value => {
    user = value;
  });

  function editProfile() {
    // For now, just prompt for name
    const name = prompt('Enter your name:', user.name);
    if (name && name.trim()) {
      currentUser.update(u => ({ ...u, name: name.trim() }));
    }
  }
</script>

<div class="min-h-screen bg-gray-50">
  <nav class="bg-white shadow">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center">
          <a href="/" class="flex-shrink-0 flex items-center group">
            <img 
              src="/hang-logo.png" 
              alt="Hang Logo" 
              class="h-10 w-auto transform transition-transform duration-200 group-hover:scale-105" 
            />
          </a>
          <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
            <a 
              href="/" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Home
            </a>
            <a 
              href="/settings/schedule" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              My Availability
            </a>
            <a 
              href="/request" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Request a Hang
            </a>
            <a 
              href="/hub" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Hang Hub
            </a>
            <a 
              href="/friends" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Friends
            </a>
            <a 
              href="/groups" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Groups
            </a>
            <a 
              href="/settings/schedule" 
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-blue-600 font-medium"
            >
              Schedule Settings
            </a>
          </div>
        </div>
        
        <!-- User Profile -->
        <div class="flex items-center">
          <button
            on:click={editProfile}
            class="inline-flex items-center px-3 py-1 text-gray-900 hover:text-blue-600"
          >
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
              <span class="text-blue-800 font-medium">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span>{user.name}</span>
          </button>
        </div>
      </div>
    </div>
  </nav>

  <main>
    <slot />
  </main>
</div>
