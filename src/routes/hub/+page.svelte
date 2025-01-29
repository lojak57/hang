<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let suggestedHangs = [];
  let confirmedHangs = [];
  let selectedHang = null;
  let showHangDetails = false;

  onMount(() => {
    const savedHangs = JSON.parse(localStorage.getItem('hangs') || '[]');
    
    // Split hangs into suggested and confirmed based on status
    suggestedHangs = savedHangs.filter(h => h.status === 'pending');
    confirmedHangs = savedHangs.filter(h => h.status === 'finalized');
  });

  function deleteHang(hang) {
    const hangs = JSON.parse(localStorage.getItem('hangs') || '[]');
    const updatedHangs = hangs.filter(h => h.id !== hang.id);
    localStorage.setItem('hangs', JSON.stringify(updatedHangs));
    
    // Update local arrays
    suggestedHangs = updatedHangs.filter(h => h.status === 'pending');
    confirmedHangs = updatedHangs.filter(h => h.status === 'finalized');
  }

  function editHang(hang) {
    goto(`/request?edit=${hang.id}`);
  }

  function viewHangDetails(hang) {
    selectedHang = hang;
    showHangDetails = true;
  }

  function closeHangDetails() {
    showHangDetails = false;
    selectedHang = null;
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatTime(timeSlot) {
    const timeSlots = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Night'
    };
    return timeSlots[timeSlot] || timeSlot;
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex items-center justify-between mb-8">
    <div class="flex items-center gap-6">
      <img src="/hang-logo.png" alt="Hang Logo" class="h-16">
      <h1 class="text-3xl font-bold text-gray-900">Hang Hub</h1>
    </div>
    <a
      href="/request"
      class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      New Hang
    </a>
  </div>

  <!-- Suggested Hangs -->
  <div class="mb-12">
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Polls Closing! ⏰</h2>
    {#if suggestedHangs.length === 0}
      <p class="text-gray-500">No active polls</p>
    {:else}
      <div class="space-y-4">
        {#each suggestedHangs as hang}
          <a 
            href="/hang/{hang.id}"
            class="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-medium text-gray-900">
                    {hang.name || (hang.group ? hang.group.name : `Hang with ${hang.friends.length} friends`)}
                  </h3>
                  {#if hang.group}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {hang.group.name}
                    </span>
                  {/if}
                </div>
                {#if hang.description}
                  <p class="text-sm text-gray-600 mt-1">{hang.description}</p>
                {/if}
                <div class="mt-1 text-sm text-gray-500">
                  {#if hang.selectedSlot}
                    {formatDate(hang.selectedSlot.date)}
                    <span class="mx-2">•</span>
                    {formatTime(hang.selectedSlot.time)}
                  {/if}
                </div>
                <div class="mt-2 text-sm">
                  <span class="text-blue-600">{hang.slots[0]?.votes || 0} votes</span>
                  <span class="mx-2">•</span>
                  <span class="text-gray-500">Poll closes {new Date(hang.pollDeadline).toLocaleString()}</span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                  class="text-blue-600 hover:text-blue-800"
                  on:click={() => editHang(hang)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  class="text-red-600 hover:text-red-800"
                  on:click={() => deleteHang(hang)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Suggested
              </span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Confirmed Hangs -->
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-4">Confirmed Hangs</h2>
    {#if confirmedHangs.length === 0}
      <p class="text-gray-500">No confirmed Hangs yet</p>
    {:else}
      <div class="space-y-4">
        {#each confirmedHangs as hang}
          <a 
            href="/hang/{hang.id}"
            class="block bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div class="flex justify-between items-start">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-lg font-medium text-gray-900">
                    {hang.name || (hang.group ? hang.group.name : `Hang with ${hang.friends.length} friends`)}
                  </h3>
                  {#if hang.group}
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {hang.group.name}
                    </span>
                  {/if}
                </div>
                {#if hang.description}
                  <p class="text-sm text-gray-600 mt-1">{hang.description}</p>
                {/if}
                <div class="mt-1 text-sm text-gray-500">
                  {#if hang.selectedSlot}
                    {formatDate(hang.selectedSlot.date)}
                    <span class="mx-2">•</span>
                    {formatTime(hang.selectedSlot.time)}
                  {/if}
                </div>
                <div class="mt-2 text-sm">
                  <span class="text-blue-600">{hang.slots[0]?.votes || 0} votes</span>
                  <span class="mx-2">•</span>
                  <span class="text-gray-500">Poll closes {new Date(hang.pollDeadline).toLocaleString()}</span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button
                  class="text-blue-600 hover:text-blue-800"
                  on:click={() => editHang(hang)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  class="text-red-600 hover:text-red-800"
                  on:click={() => deleteHang(hang)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="mt-4">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Confirmed
              </span>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </div>
</div>

<!-- Hang Details Modal -->
{#if showHangDetails && selectedHang}
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-xl max-w-2xl w-full p-6">
      <div class="flex justify-between items-start mb-6">
        <h2 class="text-2xl font-semibold">{selectedHang.title}</h2>
        <button
          class="text-gray-500 hover:text-gray-700"
          on:click={closeHangDetails}
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="space-y-6">
        <!-- Status Badge -->
        <div>
          {#if selectedHang.status === 'suggested'}
            <span class="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded">
              Suggested
            </span>
          {:else}
            <span class="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded">
              Confirmed
            </span>
          {/if}
        </div>

        <!-- Date and Time -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-1">When</h3>
          <p class="text-lg">
            {formatDate(selectedHang.date)} at {formatTime(selectedHang.time)}
          </p>
        </div>

        <!-- Location -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-1">Where</h3>
          <p class="text-lg">{selectedHang.location}</p>
          {#if selectedHang.locationDetails}
            <p class="text-sm text-gray-600 mt-1">{selectedHang.locationDetails}</p>
          {/if}
        </div>

        <!-- What -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-1">What</h3>
          <p class="text-lg">{selectedHang.activity}</p>
        </div>

        <!-- Why -->
        <div>
          <h3 class="text-sm font-medium text-gray-500 mb-1">Why</h3>
          <p class="text-gray-600">{selectedHang.description}</p>
        </div>

        <!-- Participants -->
        <div class="space-y-4">
          <!-- Confirmed Attendees -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Confirmed Attendees</h3>
            {#if selectedHang.participants?.some(p => p.status === 'confirmed')}
              <div class="space-y-2">
                {#each selectedHang.participants.filter(p => p.status === 'confirmed') as participant}
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span class="text-green-800 font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{participant.name}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500 text-sm italic">No confirmed attendees yet</p>
            {/if}
          </div>

          <!-- Waiting for Response -->
          <div>
            <h3 class="text-sm font-medium text-gray-500 mb-2">Waiting for Response</h3>
            {#if selectedHang.participants?.some(p => p.status === 'pending')}
              <div class="space-y-2">
                {#each selectedHang.participants.filter(p => p.status === 'pending') as participant}
                  <div class="flex items-center space-x-2">
                    <div class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span class="text-gray-600 font-medium">
                        {participant.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span>{participant.name}</span>
                  </div>
                {/each}
              </div>
            {:else}
              <p class="text-gray-500 text-sm italic">Everyone has responded</p>
            {/if}
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-8 flex justify-end space-x-3">
        <button
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          on:click={closeHangDetails}
        >
          Close
        </button>
        {#if selectedHang.status === 'suggested'}
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Respond to Hang
          </button>
        {:else}
          <button
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Cancel Hang
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
