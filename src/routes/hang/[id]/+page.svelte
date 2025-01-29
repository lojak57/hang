<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  let hang = null;
  let loading = true;
  let votes = {};
  let totalVotes = 0;

  onMount(async () => {
    // Get hang details from localStorage
    const hangs = JSON.parse(localStorage.getItem('hangs') || '[]');
    hang = hangs.find(h => h.id === $page.params.id);
    
    if (hang) {
      // Calculate votes for each time slot
      votes = hang.slots.reduce((acc, slot) => {
        acc[`${slot.date}-${slot.time}`] = {
          count: slot.votes?.length || 0,
          voters: slot.votes || [],
          percentage: 0
        };
        totalVotes += slot.votes?.length || 0;
        return acc;
      }, {});

      // Calculate percentages
      Object.values(votes).forEach(vote => {
        vote.percentage = totalVotes > 0 ? Math.round((vote.count / totalVotes) * 100) : 0;
      });
    }
    
    loading = false;
  });

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  function getTimeSlotLabel(time) {
    return time === 'morning' ? 'Morning'
         : time === 'afternoon' ? 'Afternoon'
         : 'Evening';
  }
</script>

<div class="max-w-2xl mx-auto p-4">
  {#if loading}
    <div class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
    </div>
  {:else if hang}
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <div class="flex items-center gap-2 mb-2">
          <h1 class="text-3xl font-bold text-gray-900">
            {hang.name || (hang.group ? hang.group.name : `Hang with ${hang.friends.length} friends`)}
          </h1>
          {#if hang.group}
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {hang.group.name}
            </span>
          {/if}
        </div>
        {#if hang.description}
          <p class="text-gray-600">{hang.description}</p>
        {/if}
      </div>

      <!-- Poll Status -->
      <div class="bg-blue-50 rounded-lg p-4">
        <h2 class="font-medium text-blue-900 mb-2">Poll Status</h2>
        <div class="text-sm text-blue-800">
          <p>Poll closes {new Date(hang.pollDeadline).toLocaleString()}</p>
          <p class="mt-1">{totalVotes} vote{totalVotes !== 1 ? 's' : ''} cast so far</p>
          {#if hang.autoFinalize}
            <p class="mt-1 text-blue-600">Will auto-finalize at deadline</p>
          {/if}
        </div>
      </div>

      <!-- Time Slots -->
      <div>
        <h2 class="text-xl font-semibold mb-4">Time Slots</h2>
        <div class="space-y-4">
          {#each hang.slots as slot}
            {@const voteKey = `${slot.date}-${slot.time}`}
            {@const voteInfo = votes[voteKey]}
            <div class="bg-white rounded-lg border p-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <h3 class="font-medium">{formatDate(slot.date)}</h3>
                  <p class="text-sm text-gray-500">{getTimeSlotLabel(slot.time)}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium">{voteInfo.count} vote{voteInfo.count !== 1 ? 's' : ''}</p>
                  <p class="text-sm text-gray-500">{voteInfo.percentage}% of total</p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                  style="width: {voteInfo.percentage}%"
                ></div>
              </div>

              <!-- Voters -->
              {#if voteInfo.voters.length > 0}
                <div class="mt-3">
                  <p class="text-sm text-gray-500 mb-1">Voted by:</p>
                  <div class="flex flex-wrap gap-2">
                    {#each voteInfo.voters as voter}
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {voter}
                      </span>
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {/each}
        </div>
      </div>

      <!-- Back Button -->
      <div class="pt-4">
        <a
          href="/hub"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to Hub
        </a>
      </div>
    </div>
  {:else}
    <div class="text-center py-12">
      <p class="text-gray-600">Hang not found</p>
      <a
        href="/hub"
        class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to Hub
      </a>
    </div>
  {/if}
</div>
