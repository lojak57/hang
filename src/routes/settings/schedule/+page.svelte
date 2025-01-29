<script>
  import { onMount } from 'svelte';
  import { currentUserId } from '$lib/stores/userStore';

  let userId;
  currentUserId.subscribe(value => {
    userId = value;
  });

  let defaultSchedule = {
    Monday: { morning: 1, afternoon: 1, night: 1 },
    Tuesday: { morning: 1, afternoon: 1, night: 1 },
    Wednesday: { morning: 1, afternoon: 1, night: 1 },
    Thursday: { morning: 1, afternoon: 1, night: 1 },
    Friday: { morning: 1, afternoon: 1, night: 1 },
    Saturday: { morning: 1, afternoon: 1, night: 1 },
    Sunday: { morning: 1, afternoon: 1, night: 1 }
  };

  let groups = [];
  let visibilitySettings = {};
  let schedule = Array(7).fill().map(() => Array(24).fill(false));
  let selectedDays = Array(7).fill(true);
  let visibilityMode = 'groups'; // 'all', 'groups', 'individual'
  let selectedGroups = [];
  let selectedFriends = [];
  let friends = [];

  const timeSlots = [
    { id: 'morning', label: '🌅 Morning' },
    { id: 'afternoon', label: '☀️ Afternoon' },
    { id: 'night', label: '🌙 Night' }
  ];

  onMount(() => {
    // Load default schedule
    const savedSchedule = localStorage.getItem('defaultSchedule');
    if (!savedSchedule) {
      // If no saved schedule, save the default "maybe" schedule
      localStorage.setItem('defaultSchedule', JSON.stringify(defaultSchedule));
      // Also apply it to availability
      saveSchedule();
    } else {
      defaultSchedule = JSON.parse(savedSchedule);
    }

    // Load groups
    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      groups = JSON.parse(savedGroups);
    }

    // Load visibility settings
    const savedVisibility = localStorage.getItem('scheduleVisibility');
    if (savedVisibility) {
      const visibility = JSON.parse(savedVisibility);
      visibilityMode = visibility.mode;
      selectedGroups = visibility.groups || [];
      selectedFriends = visibility.friends || [];
    } else {
      // Initialize visibility settings for each group
      groups.forEach(group => {
        visibilitySettings[group.id] = false;
      });
    }

    // Load friends
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      friends = JSON.parse(savedFriends);
    }
  });

  function toggleAvailability(day, timeSlot) {
    const currentValue = defaultSchedule[day][timeSlot];
    defaultSchedule[day][timeSlot] = (currentValue + 1) % 3;
    defaultSchedule = defaultSchedule; // Trigger reactivity
    saveSchedule();
  }

  function toggleVisibility(groupId) {
    visibilitySettings[groupId] = !visibilitySettings[groupId];
    localStorage.setItem('scheduleVisibility', JSON.stringify(visibilitySettings));
  }

  function saveSchedule() {
    localStorage.setItem('defaultSchedule', JSON.stringify(defaultSchedule));
    localStorage.setItem('scheduleVisibility', JSON.stringify({
      mode: visibilityMode,
      groups: selectedGroups,
      friends: selectedFriends
    }));
    
    // Silently apply the schedule to availability without showing popup
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const availability = {};
    while (startDate <= endDate) {
      const dateKey = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      
      availability[`${dateKey}_morning`] = defaultSchedule[dayName].morning;
      availability[`${dateKey}_afternoon`] = defaultSchedule[dayName].afternoon;
      availability[`${dateKey}_evening`] = defaultSchedule[dayName].night;
      
      startDate.setDate(startDate.getDate() + 1);
    }
    
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

  function toggleDay(day) {
    selectedDays[day] = !selectedDays[day];
  }

  function toggleTimeSlot(day, hour) {
    schedule[day][hour] = !schedule[day][hour];
  }

  function toggleAllSelectedDays(hour) {
    const newValue = !selectedDays.some((selected, day) => selected && schedule[day][hour]);
    selectedDays.forEach((selected, day) => {
      if (selected) {
        schedule[day][hour] = newValue;
      }
    });
    schedule = schedule; // Trigger reactivity
  }

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i < 12 ? 'AM' : 'PM';
    return `${hour}:00 ${ampm}`;
  });
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white rounded-2xl shadow-xl p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Schedule Settings</h1>
      <button
        on:click={saveSchedule}
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
      >
        Apply to Current Week
      </button>
    </div>

    <!-- Default Schedule -->
    <div class="mb-12">
      <h2 class="text-xl font-semibold mb-6">Default Weekly Schedule</h2>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr>
              <th class="text-left py-2">Day</th>
              {#each timeSlots as slot}
                <th class="text-center py-2">{slot.label}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each Object.entries(defaultSchedule) as [day, slots]}
              <tr class="border-t">
                <td class="py-3">{day}</td>
                {#each timeSlots as slot}
                  {@const status = slots[slot.id]}
                  <td class="py-2 px-2">
                    <button
                      class="w-full py-2 px-4 rounded-full text-white transition-colors {getStatusClass(status)}"
                      on:click={() => toggleAvailability(day, slot.id)}
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

    <!-- Visibility Settings -->
    <div>
      <h2 class="text-xl font-semibold mb-6">Schedule Visibility</h2>
      <p class="text-gray-600 mb-6">Control which groups can see your default availability schedule.</p>
      
      <div class="space-y-4">
        {#each groups as group}
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-medium">{group.name}</h3>
              <p class="text-sm text-gray-600">{group.members.length} members</p>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                class="sr-only peer"
                checked={visibilitySettings[group.id]}
                on:change={() => toggleVisibility(group.id)}
              >
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        {/each}
      </div>
    </div>

    <div class="border-t pt-6">
      <h2 class="text-xl font-semibold mb-4">Default Weekly Schedule</h2>
      <!-- Day Selection -->
      <div class="flex flex-wrap gap-2 mb-4">
        {#each days as day, i}
          <button
            class="px-3 py-1 rounded-full text-sm font-medium transition-colors"
            class:bg-blue-600={selectedDays[i]}
            class:text-white={selectedDays[i]}
            class:bg-gray-100={!selectedDays[i]}
            class:text-gray-700={!selectedDays[i]}
            on:click={() => toggleDay(i)}
          >
            {day}
          </button>
        {/each}
      </div>
      
      <!-- Schedule Grid -->
      <div class="overflow-x-auto">
        <table class="min-w-full">
          <thead>
            <tr>
              <th class="w-24"></th>
              {#each days as day, i}
                {#if selectedDays[i]}
                  <th class="px-2 py-1 text-center">{day}</th>
                {/if}
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each hours as hour, i}
              <tr class="border-t">
                <td class="px-2 py-1 text-right text-sm text-gray-600">
                  {hour}
                </td>
                {#each days as _, dayIndex}
                  {#if selectedDays[dayIndex]}
                    <td class="px-1 py-1 text-center">
                      <button
                        class="w-6 h-6 rounded transition-colors"
                        class:bg-blue-600={schedule[dayIndex][i]}
                        class:bg-gray-100={!schedule[dayIndex][i]}
                        on:click={() => toggleTimeSlot(dayIndex, i)}
                      />
                    </td>
                  {/if}
                {/each}
                <td class="pl-2">
                  <button
                    class="text-sm text-gray-500 hover:text-gray-700"
                    on:click={() => toggleAllSelectedDays(i)}
                  >
                    Toggle All
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
    
    <!-- Save Button -->
    <div class="mt-6 flex justify-end">
      <button
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        on:click={saveSchedule}
      >
        Save Changes
      </button>
    </div>
  </div>
</div>
