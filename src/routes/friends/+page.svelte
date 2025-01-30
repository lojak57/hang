<script>
  import { onMount } from 'svelte';
  
  let friends = [];
  let newFriendName = '';
  let newFriendPhone = '';
  let newFriendEmail = '';
  let shareUrl = '';
  let editingFriend = null;
  let showEditModal = false;
  let formError = '';
  
  onMount(() => {
    // Load friends from localStorage
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      friends = JSON.parse(savedFriends);
      // Add phone and email fields to existing friends if they don't have it
      friends = friends.map(friend => ({
        ...friend,
        phone: friend.phone || '',
        email: friend.email || '',
      }));
      localStorage.setItem('friends', JSON.stringify(friends));
    }
    
    // Generate share URL
    shareUrl = `${window.location.origin}/calendar?friend=${generateUserId()}`;
  });
  
  function generateUserId() {
    return Math.random().toString(36).substring(2, 15);
  }

  function formatPhoneNumber(phoneNumberString) {
    const cleaned = ('' + phoneNumberString).replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
      return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumberString;
  }

  function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
  }
  
  async function addFriend() {
    formError = '';
    if (!newFriendName) {
      formError = 'Name is required';
      return;
    }
    if (!newFriendPhone) {
      formError = 'Phone number is required';
      return;
    }
    if (!validatePhoneNumber(newFriendPhone)) {
      formError = 'Please enter a valid 10-digit phone number';
      return;
    }
    
    const newFriend = {
      id: generateUserId(),
      name: newFriendName,
      phone: newFriendPhone,
      email: newFriendEmail,
      dateAdded: new Date().toISOString()
    };
    
    friends = [...friends, newFriend];
    localStorage.setItem('friends', JSON.stringify(friends));
    
    newFriendName = '';
    newFriendPhone = '';
    newFriendEmail = '';
    formError = '';
  }
  
  function removeFriend(id) {
    friends = friends.filter(f => f.id !== id);
    localStorage.setItem('friends', JSON.stringify(friends));
  }
  
  function copyShareUrl() {
    navigator.clipboard.writeText(shareUrl);
  }

  function openEditModal(friend) {
    editingFriend = { ...friend };
    showEditModal = true;
    formError = '';
  }

  function closeEditModal() {
    editingFriend = null;
    showEditModal = false;
    formError = '';
  }

  function saveFriendChanges() {
    formError = '';
    if (!editingFriend.name) {
      formError = 'Name is required';
      return;
    }
    if (!editingFriend.phone) {
      formError = 'Phone number is required';
      return;
    }
    if (!validatePhoneNumber(editingFriend.phone)) {
      formError = 'Please enter a valid 10-digit phone number';
      return;
    }

    friends = friends.map(friend => 
      friend.id === editingFriend.id ? editingFriend : friend
    );
    localStorage.setItem('friends', JSON.stringify(friends));
    closeEditModal();
  }
</script>

<div class="max-w-4xl mx-auto p-4">
  <h1 class="text-3xl font-bold mb-8">Friends</h1>
  
  <!-- Add Friend Form -->
  <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
    <h2 class="text-xl font-semibold mb-4">Add a Friend</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label for="newFriendName" class="block text-sm font-medium text-gray-700 mb-1">
          Name <span class="text-red-500">*</span>
        </label>
        <input
          id="newFriendName"
          type="text"
          bind:value={newFriendName}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
          aria-required="true"
        />
      </div>
      <div>
        <label for="newFriendPhone" class="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span class="text-red-500">*</span>
        </label>
        <input
          id="newFriendPhone"
          type="tel"
          bind:value={newFriendPhone}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          required
          aria-required="true"
        />
      </div>
      <div>
        <label for="newFriendEmail" class="block text-sm font-medium text-gray-700 mb-1">
          Email (optional)
        </label>
        <input
          id="newFriendEmail"
          type="email"
          bind:value={newFriendEmail}
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
    {#if formError}
      <div class="mt-2 text-sm text-red-600">
        {formError}
      </div>
    {/if}
    <button
      on:click={addFriend}
      class="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Add Friend
    </button>
  </div>
  
  <!-- Share Calendar -->
  <div class="bg-white rounded-lg shadow-lg p-6 mb-8">
    <h2 id="shareCalendarTitle" class="text-xl font-semibold mb-4">Share Your Calendar</h2>
    <div class="flex items-center space-x-4">
      <label for="shareUrlInput" class="sr-only">Share URL</label>
      <input
        id="shareUrlInput"
        type="text"
        readonly
        value={shareUrl}
        class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
        aria-label="Calendar share URL"
      >
      <button
        on:click={copyShareUrl}
        class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        aria-label="Copy share link"
      >
        Copy Link
      </button>
    </div>
  </div>
  
  <!-- Friends List -->
  <div class="bg-white rounded-lg shadow-lg p-6">
    <h2 class="text-xl font-semibold mb-4">Your Friends ({friends.length})</h2>
    {#if friends.length === 0}
      <p class="text-gray-600">You haven't added any friends yet.</p>
    {:else}
      <div class="space-y-4">
        {#each friends as friend}
          <div class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div>
              <div class="font-medium">{friend.name}</div>
              <div class="text-sm text-gray-600 space-y-1">
                <div class="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                  </svg>
                  {formatPhoneNumber(friend.phone)}
                </div>
                {#if friend.email}
                  <div class="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884L2 7v8a2 2 0 002 2h14a2 2 0 002-2V9.882l-8 3.998z" />
                    </svg>
                    {friend.email}
                  </div>
                {/if}
              </div>
            </div>
            <div class="flex items-center space-x-3">
              <button
                on:click={() => openEditModal(friend)}
                class="text-blue-600 hover:text-blue-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                on:click={() => removeFriend(friend.id)}
                class="text-red-600 hover:text-red-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Edit Friend Modal -->
{#if showEditModal && editingFriend}
  <div 
    role="dialog"
    aria-labelledby="editFriendTitle"
    aria-modal="true"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
  >
    <div class="bg-white rounded-xl max-w-lg w-full p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 id="editFriendTitle" class="text-xl font-semibold">Edit Friend</h2>
        <button
          on:click={closeEditModal}
          class="text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-4">
        <div>
          <label for="editFriendName" class="block text-sm font-medium text-gray-700 mb-1">
            Name <span class="text-red-500">*</span>
          </label>
          <input
            id="editFriendName"
            type="text"
            bind:value={editingFriend.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label for="editFriendPhone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span class="text-red-500">*</span>
          </label>
          <input
            id="editFriendPhone"
            type="tel"
            bind:value={editingFriend.phone}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
            aria-required="true"
          />
        </div>
        <div>
          <label for="editFriendEmail" class="block text-sm font-medium text-gray-700 mb-1">
            Email (optional)
          </label>
          <input
            id="editFriendEmail"
            type="email"
            bind:value={editingFriend.email}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {#if formError}
        <div class="mt-4 text-sm text-red-600">
          {formError}
        </div>
      {/if}

      <div class="mt-6 flex justify-end space-x-3">
        <button
          on:click={closeEditModal}
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          on:click={saveFriendChanges}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
{/if}
