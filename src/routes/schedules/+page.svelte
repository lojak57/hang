<script>
  import { onMount } from 'svelte';

  let schedules = [];
  let newScheduleName = '';
  let selectedDays = {
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
    Saturday: {},
    Sunday: {}
  };

  const timeSlots = [
    { id: 'morning', label: '🌅 Morning' },
    { id: 'afternoon', label: '☀️ Afternoon' },
    { id: 'night', label: '🌙 Night' }
  ];

  onMount(() => {
    const savedSchedules = localStorage.getItem('savedSchedules');
    if (savedSchedules) {
      schedules = JSON.parse(savedSchedules);
    }
  });

  function saveSchedule() {
    if (!newScheduleName.trim()) {
      alert('Please enter a schedule name');
      return;
    }

    const newSchedule = {
      id: Date.now(),
      name: newScheduleName,
      days: { ...selectedDays }
    };

    schedules = [...schedules, newSchedule];
    localStorage.setItem('savedSchedules', JSON.stringify(schedules));
    
    // Reset form
    newScheduleName = '';
    selectedDays = {
      Monday: {},
      Tuesday: {},
      Wednesday: {},
      Thursday: {},
      Friday: {},
      Saturday: {},
      Sunday: {}
    };
  }

  function deleteSchedule(id) {
    schedules = schedules.filter(s => s.id !== id);
    localStorage.setItem('savedSchedules', JSON.stringify(schedules));
  }

  function toggleAvailability(day, timeSlot) {
    const currentValue = selectedDays[day][timeSlot] || 0;
    selectedDays[day][timeSlot] = (currentValue + 1) % 3;
    selectedDays = selectedDays; // Trigger reactivity
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

  function applySchedule(schedule) {
    // Load existing availability
    const currentAvailability = JSON.parse(localStorage.getItem('availability') || '{}');
    
    // Get next 7 days
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
    }
    
    // Apply schedule to each day
    dates.forEach(formattedDate => {
      const dayOfWeek = new Date(formattedDate).toLocaleDateString('en-US', { weekday: 'long' });
      timeSlots.forEach(slot => {
        const key = `${formattedDate}_${slot.id}`;
        if (schedule.days[dayOfWeek][slot.id] !== undefined) {
          currentAvailability[key] = schedule.days[dayOfWeek][slot.id];
        }
      });
    });
    
    // Save back to localStorage
    localStorage.setItem('availability', JSON.stringify(currentAvailability));
    alert('Schedule applied! Refresh your calendar to see the changes.');
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white rounded-2xl shadow-xl p-8">
    <h1 class="text-3xl font-bold text-gray-900 mb-8">Saved Schedules</h1>

    <!-- Create New Schedule -->
    <div class="mb-12 bg-gray-50 rounded-xl p-6">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Create New Schedule</h2>
      <div class="mb-4">
        <input
          type="text"
          bind:value={newScheduleName}
          placeholder="Schedule Name (e.g., Work Week, Weekend)"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <!-- Time Slot Grid -->
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
            {#each Object.entries(selectedDays) as [day, slots]}
              <tr class="border-t">
                <td class="py-3">{day}</td>
                {#each timeSlots as slot}
                  {@const status = slots[slot.id] || 0}
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

      <button
        on:click={saveSchedule}
        class="mt-6 w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Save Schedule
      </button>
    </div>

    <!-- Saved Schedules List -->
    {#if schedules.length > 0}
      <div class="space-y-4">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Your Saved Schedules</h2>
        {#each schedules as schedule}
          <div class="bg-white border border-gray-200 rounded-lg p-4">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-medium text-lg">{schedule.name}</h3>
              <div class="flex space-x-2">
                <button
                  on:click={() => applySchedule(schedule)}
                  class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Apply to Calendar
                </button>
                <button
                  on:click={() => deleteSchedule(schedule.id)}
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            
            <!-- Preview Grid -->
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr>
                    <th class="text-left py-2 text-sm">Day</th>
                    {#each timeSlots as slot}
                      <th class="text-center py-2 text-sm">{slot.label}</th>
                    {/each}
                  </tr>
                </thead>
                <tbody>
                  {#each Object.entries(schedule.days) as [day, slots]}
                    <tr class="border-t">
                      <td class="py-2 text-sm">{day}</td>
                      {#each timeSlots as slot}
                        {@const status = slots[slot.id] || 0}
                        <td class="py-1 px-1">
                          <div
                            class="w-full py-1 px-2 rounded-full text-white text-sm text-center {getStatusClass(status)}"
                          >
                            {getStatusText(status)}
                          </div>
                        </td>
                      {/each}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-center text-gray-500">
        No saved schedules yet. Create one above!
      </div>
    {/if}
  </div>
</div>
