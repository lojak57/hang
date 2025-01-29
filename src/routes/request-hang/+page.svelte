<script>
  import { onMount } from 'svelte';

  let selectedGroup = null;
  let groups = [];
  let availability = {};
  let groupAvailability = {};
  let visibilitySettings = {};
  let dateRange = [];

  const timeSlots = [
    { id: 'morning', label: '🌅 Morning' },
    { id: 'afternoon', label: '☀️ Afternoon' },
    { id: 'night', label: '🌙 Night' }
  ];

  onMount(() => {
    // Load groups
    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      groups = JSON.parse(savedGroups);
    }

    // Load visibility settings
    const savedVisibility = localStorage.getItem('scheduleVisibility');
    if (savedVisibility) {
      visibilitySettings = JSON.parse(savedVisibility);
    }

    // Generate date range (next 7 days)
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dateRange.push({
        date,
        formatted: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' })
      });
    }
    dateRange = dateRange; // Trigger reactivity

    // Load personal availability
    const savedAvailability = localStorage.getItem('availability');
    if (savedAvailability) {
      availability = JSON.parse(savedAvailability);
    } else {
      // Initialize from default schedule if exists
      const savedSchedule = localStorage.getItem('defaultSchedule');
      if (savedSchedule) {
        const defaultSchedule = JSON.parse(savedSchedule);
        dateRange.forEach(({ formatted, dayName }) => {
          timeSlots.forEach(slot => {
            const key = `${formatted}_${slot.id}`;
            availability[key] = defaultSchedule[dayName][slot.id];
          });
        });
      }
    }
  });

  function onGroupSelect(event) {
    const groupId = parseInt(event.target.value);
    selectedGroup = groups.find(g => g.id === groupId);
    
    if (selectedGroup && visibilitySettings[selectedGroup.id]) {
      // Load group members' default schedules
      groupAvailability = {};
      selectedGroup.members.forEach(memberId => {
        const memberSchedule = localStorage.getItem(`defaultSchedule_${memberId}`);
        if (memberSchedule) {
          const schedule = JSON.parse(memberSchedule);
          dateRange.forEach(({ formatted, dayName }) => {
            timeSlots.forEach(slot => {
              const key = `${formatted}_${slot.id}`;
              if (!groupAvailability[key]) groupAvailability[key] = [];
              if (schedule[dayName][slot.id] === 2) { // Only count "available" status
                groupAvailability[key].push(memberId);
              }
            });
          });
        }
      });
    }
  }

  function toggleAvailability(date, slot) {
    const key = `${date}_${slot}`;
    availability[key] = (availability[key] + 1) % 3;
    availability = availability; // Trigger reactivity
    localStorage.setItem('availability', JSON.stringify(availability));
  }

  function getStatusClass(status) {
    switch(status) {
      case 1: return 'bg-yellow-500';
      case 2: return 'bg-green-500';
      default: return 'bg-red-500';
    }
  }

  function getStatusText(status) {
    switch(status) {
      case 1: return '?';
      case 2: return '✓';
      default: return '✕';
    }
  }

  function getGroupAvailabilityClass(membersAvailable, totalMembers) {
    const percentage = (membersAvailable / totalMembers) * 100;
    if (percentage >= 75) return 'bg-green-100';
    if (percentage >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  }

  function submitRequest() {
    // Here you would handle creating the hang request
    // For now, we'll just show an alert
    alert('Hang request created! Your friends will be notified.');
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white rounded-2xl shadow-xl p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Request a hangout</h1>

    <!-- Group Selection -->
    <div class="mb-8">
      <label for="group" class="block text-sm font-medium text-gray-700 mb-2">Who do you want to hang with?</label>
      <select
        id="group"
        class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
        on:change={onGroupSelect}
      >
        <option value="">Select a group</option>
        {#each groups as group}
          <option value={group.id}>{group.name} ({group.members.length} members)</option>
        {/each}
      </select>
    </div>

    <!-- Availability Grid -->
    <div class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Your Availability</h2>
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
            {#each dateRange as { formatted, date }}
              <tr class="border-t">
                <td class="py-3">{formatted}</td>
                {#each timeSlots as slot}
                  {@const key = `${formatted}_${slot.id}`}
                  {@const status = availability[key] || 0}
                  <td class="py-2 px-2">
                    <button
                      class="w-full py-2 px-4 rounded-full text-white transition-colors {getStatusClass(status)} hover:opacity-90"
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
    </div>

    <!-- Group Availability Preview -->
    {#if selectedGroup && visibilitySettings[selectedGroup.id]}
      <div class="mb-8">
        <h2 class="text-xl font-semibold mb-4">Group Availability Preview</h2>
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
              {#each dateRange as { formatted }}
                <tr class="border-t">
                  <td class="py-3">{formatted}</td>
                  {#each timeSlots as slot}
                    {@const key = `${formatted}_${slot.id}`}
                    {@const membersAvailable = groupAvailability[key]?.length || 0}
                    <td class="py-2 px-2">
                      <div 
                        class="w-full py-2 px-4 rounded-lg text-center {getGroupAvailabilityClass(membersAvailable, selectedGroup.members.length)}"
                      >
                        {membersAvailable}/{selectedGroup.members.length}
                      </div>
                    </td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}

    <!-- Submit Button -->
    <div class="flex justify-end">
      <button
        class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        on:click={submitRequest}
      >
        Request Hang
      </button>
    </div>
  </div>
</div>
