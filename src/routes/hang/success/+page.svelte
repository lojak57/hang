# Success Page

<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import CheckCircleIcon from './CheckCircleIcon.svelte'; // Assuming the icon is in the same directory

  let hang = null;
  let loading = true;

  onMount(() => {
    const hangs = JSON.parse(localStorage.getItem('hangs') || '[]');
    if (hangs.length > 0) {
      hang = hangs[hangs.length - 1]; // Get most recent hang
    }
    loading = false;
  });

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  }

  function getTimeSlotLabel(slot) {
    const labels = {
      morning: '🌅 Morning',
      afternoon: '☀️ Afternoon',
      evening: '🌙 Night'
    };
    return labels[slot] || slot;
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      {#if loading}
        <div class="text-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      {:else if hang}
        <div class="text-center">
          <img src="/hang-logo.png" alt="Hang Logo" class="h-28 mx-auto mb-8">
          <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <h1 class="text-3xl font-bold text-gray-900">Hang Created!</h1>
          <p class="text-gray-600 mt-2">Your friends will receive an invitation to vote</p>
        </div>

        <div class="bg-white rounded-lg border p-6 space-y-6">
          <!-- Hang Details -->
          <div>
            <h2 class="font-medium text-lg text-gray-900 mb-2">
              {hang.group ? hang.group.name : `Hang with ${hang.friends.length} friends`}
            </h2>
            
            {#if hang.selectedSlot}
              <div class="bg-green-50 rounded-lg p-4">
                <h3 class="text-sm font-medium text-green-800">Recommended Time</h3>
                <div class="mt-1 text-sm text-green-700">
                  <p class="font-medium">{formatDate(hang.selectedSlot.date)}</p>
                  <p>{getTimeSlotLabel(hang.selectedSlot.time)}</p>
                </div>
              </div>
            {/if}
          </div>

          <!-- Poll Details -->
          <div class="border-t pt-4">
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>Poll closes {new Date(hang.pollDeadline).toLocaleString()}</span>
              {#if hang.autoFinalize}
                <span class="text-blue-600">Will auto-finalize at deadline</span>
              {/if}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col space-y-3">
            <button
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              on:click={() => goto('/hub')}
            >
              View in Hang Hub
            </button>
            <button
              class="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              on:click={() => goto('/request')}
            >
              Create Another Hang
            </button>
          </div>
        </div>
      {:else}
        <div class="text-center py-12">
          <p class="text-gray-600">No hang details found</p>
          <button
            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            on:click={() => goto('/request')}
          >
            Create a Hang
          </button>
        </div>
      {/if}
    </div>
  </div>
</div>
