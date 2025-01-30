<script>
  import { onMount } from 'svelte';
  import { user } from '$lib/stores/auth';

  let currentDate = new Date();
  let selectedDates = new Set();
  let calendar = [];
  let userAvailability = {};

  // Get the first day of the month
  function getFirstDayOfMonth(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  // Get the number of days in the month
  function getDaysInMonth(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  // Generate calendar data
  function generateCalendar() {
    const firstDay = getFirstDayOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const startingDay = firstDay.getDay(); // 0 = Sunday

    calendar = [];
    let week = new Array(7).fill(null);

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDay; i++) {
      week[i] = null;
    }

    // Fill in the days of the month
    let dayCounter = 1;
    for (let i = startingDay; i < 7; i++) {
      week[i] = dayCounter++;
    }
    calendar.push(week);

    // Fill in the rest of the weeks
    while (dayCounter <= daysInMonth) {
      week = new Array(7).fill(null);
      for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
        week[i] = dayCounter++;
      }
      calendar.push(week);
    }
  }

  // Toggle date selection
  function toggleDate(day) {
    if (!day || !$user) return;

    const dateStr = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    if (selectedDates.has(dateStr)) {
      selectedDates.delete(dateStr);
    } else {
      selectedDates.add(dateStr);
    }

    // Update availability in localStorage
    const storedAvailability = localStorage.getItem(`availability_${$user.id}`);
    if (storedAvailability) {
      userAvailability = JSON.parse(storedAvailability);
    } else {
      userAvailability = {};
    }

    if (!userAvailability[dateStr]) {
      userAvailability[dateStr] = true;
    } else {
      userAvailability[dateStr] = !userAvailability[dateStr];
    }

    localStorage.setItem(`availability_${$user.id}`, JSON.stringify(userAvailability));
  }

  // Load user's availability for the current month
  onMount(async () => {
    // Load availability from localStorage
    const storedAvailability = localStorage.getItem(`availability_${$user.id}`);
    if (storedAvailability) {
      userAvailability = JSON.parse(storedAvailability);
    }

    generateCalendar();

    // Load selected dates from availability
    for (const dateStr in userAvailability) {
      if (userAvailability[dateStr]) {
        selectedDates.add(dateStr);
      }
    }
  });

  // Navigation functions
  function previousMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1);
    generateCalendar();
  }

  function nextMonth() {
    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1);
    generateCalendar();
  }

  $: monthName = currentDate.toLocaleString('default', { month: 'long' });
  $: year = currentDate.getFullYear();
</script>

<div class="max-w-3xl mx-auto p-4">
  <div class="flex justify-between items-center mb-4">
    <button
      class="px-4 py-2 text-gray-700 hover:text-gray-900"
      on:click={previousMonth}
    >
      ←
    </button>
    <h2 class="text-xl font-semibold">{monthName} {year}</h2>
    <button
      class="px-4 py-2 text-gray-700 hover:text-gray-900"
      on:click={nextMonth}
    >
      →
    </button>
  </div>

  <div class="grid grid-cols-7 gap-1">
    {#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day}
      <div class="text-center py-2 text-gray-600 font-medium">{day}</div>
    {/each}

    {#each calendar as week}
      {#each week as day}
        {#if day !== null}
          <button
            class="aspect-square p-2 text-center hover:bg-gray-100 rounded-lg transition-colors
              {selectedDates.has(`${year}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`) ? 'bg-green-100 hover:bg-green-200' : ''}"
            on:click={() => toggleDate(day)}
          >
            {day}
          </button>
        {:else}
          <div class="aspect-square"></div>
        {/if}
      {/each}
    {/each}
  </div>
</div>
