<script>
  import { onMount } from 'svelte';

  // Status: 0 = Not Available (red), 1 = Check with me (yellow), 2 = Available (green)
  let availability = {};
  let groups = [];
  let selectedGroupId = '';
  
  // Get dates for the next 7 days
  function getNextWeekDates() {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        date: date,
        formatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    return dates;
  }

  const timeSlots = [
    { id: 'morning', label: '🌅 Morning' },
    { id: 'afternoon', label: '☀️ Afternoon' },
    { id: 'night', label: '🌙 Night' }
  ];

  const dates = getNextWeekDates();

  onMount(() => {
    // Load from localStorage
    const saved = localStorage.getItem('availability');
    if (saved) {
      availability = JSON.parse(saved);
    }

    // Load groups
    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      groups = JSON.parse(savedGroups);
    }
  });

  function toggleAvailability(date, timeSlot) {
    const key = `${date}_${timeSlot}`;
    const currentValue = availability[key] || 0;
    const newValue = (currentValue + 1) % 3;
    availability[key] = newValue;
    availability = { ...availability };

    // Save to localStorage
    localStorage.setItem('availability', JSON.stringify(availability));
  }

  function getStatusClass(status) {
    switch(status) {
      case 1: return 'bg-yellow-500 hover:bg-yellow-600';
      case 2: return 'bg-green-500 hover:bg-green-600';
      default: return 'bg-red-500 hover:bg-red-600';
    }
  }

  function getStatusText(status) {
    switch(status) {
      case 1: return '?';
      case 2: return '✓';
      default: return '✕';
    }
  }

  function requestHang() {
    if (!selectedGroupId) {
      alert('Please select a group to hang out with!');
      return;
    }

    const selectedGroup = groups.find(g => g.id === selectedGroupId);
    if (!selectedGroup) return;

    // Get available times
    const availableTimes = Object.entries(availability)
      .filter(([_, status]) => status > 0) // Include both "available" and "check with me"
      .map(([key, status]) => {
        const [date, timeSlot] = key.split('_');
        return { date, timeSlot, status };
      });

    if (availableTimes.length === 0) {
      alert('Please select at least one available time slot!');
      return;
    }

    alert(`Great! We'll send a hang request to ${selectedGroup.name} with your availability!`);
    // TODO: Implement the actual hang request sending logic
  }
</script>

<div class="p-4 max-w-3xl mx-auto">
  <h1 class="text-3xl font-bold mb-8">Request a Hangout</h1>

  <div class="bg-white rounded-lg shadow-lg p-6">
    <!-- Group Selection -->
    <div class="mb-6">
      <label for="groupSelect" class="block text-sm font-medium text-gray-700 mb-2">Who do you want to hang with?</label>
      {#if groups.length > 0}
        <select
          id="groupSelect"
          bind:value={selectedGroupId}
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
        >
          <option value="">Select a group</option>
          {#each groups as group}
            <option value={group.id}>{group.name} ({group.members.length} members)</option>
          {/each}
        </select>
      {:else}
        <div class="text-gray-500 text-sm">
          No groups created yet. <a href="/groups" class="text-blue-600 hover:text-blue-700">Create a group</a> to get started!
        </div>
      {/if}
    </div>

    <h2 class="text-xl font-semibold mb-6">Your Availability</h2>

    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr>
            <th class="text-left py-2">Date</th>
            {#each timeSlots as slot}
              <th class="text-center py-2">{slot.label}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each dates as { date, formatted }}
            <tr class="border-t">
              <td class="py-3">{formatted}</td>
              {#each timeSlots as slot}
                {@const status = availability[`${formatted}_${slot.id}`] || 0}
                <td class="py-2 px-2">
                  <button
                    class="w-full py-2 px-4 rounded-full text-white transition-colors {getStatusClass(status)}"
                    on:click={() => toggleAvailability(formatted, slot.id)}
                  >
                    {getStatusText(status)}
                  </button>
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-6">
      <button
        on:click={requestHang}
        class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        disabled={!selectedGroupId}
      >
        Request Hang
      </button>
    </div>
  </div>
</div>
