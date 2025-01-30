<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { addSuggestedHang } from '$lib/stores/hangStore';
  import { currentUser } from '$lib/stores/currentUser';
  import { debounce } from 'lodash-es';
  import { clickOutside } from '$lib/actions/clickOutside';

  let searchQuery = '';
  let friends = [];
  let filteredFriends = [];
  let recentContacts = [];
  let groups = [];
  let selectedFriends = [];
  let selectedGroup = null;
  let isComboboxOpen = false;
  let groupsExpanded = false;
  let individualsExpanded = false;
  let dateRange = { start: '', end: '' };
  let suggestedSlots = [];
  let selectedSlot = null;
  let step = 1;
  let activity = '';
  let location = '';
  let locationDetails = '';
  let description = '';
  let user;
  let duration = '2'; // hours
  let autoFinalize = false;
  let finalizing = false;
  let hangName = '';
  let hangDescription = '';

  $: selectedCount = selectedFriends.length;

  currentUser.subscribe(value => {
    user = value;
  });

  onMount(() => {
    // Initialize dates to today and a week from today
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    dateRange = {
      start: today.toISOString().split('T')[0],
      end: nextWeek.toISOString().split('T')[0]
    };

    // Initialize current user's availability if not set
    if (!localStorage.getItem('availability')) {
      const defaultAvailability = {};
      for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
        const formatted = date.toISOString().split('T')[0];
        defaultAvailability[formatted] = {
          morning: 'maybe',
          afternoon: 'maybe',
          evening: 'maybe'
        };
      }
      localStorage.setItem('availability', JSON.stringify(defaultAvailability));
    }

    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      friends = JSON.parse(savedFriends);
      
      // Initialize availability for all friends
      friends.forEach(friend => {
        const availKey = `availability_${friend.id}`;
        if (!localStorage.getItem(availKey)) {
          const defaultAvailability = {};
          for (let date = new Date(today); date <= nextWeek; date.setDate(date.getDate() + 1)) {
            const formatted = date.toISOString().split('T')[0];
            defaultAvailability[formatted] = {
              morning: 'maybe',
              afternoon: 'maybe',
              evening: 'maybe'
            };
          }
          localStorage.setItem(availKey, JSON.stringify(defaultAvailability));
        }
      });
    }

    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      groups = JSON.parse(savedGroups);
    }
  });

  $: {
    // Filter friends based on search query
    filteredFriends = friends.filter(friend => 
      friend.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    // Sort alphabetically
    filteredFriends.sort((a, b) => a.name.localeCompare(b.name));
  }

  // Get first letter for indexing
  function getFirstLetter(name) {
    return name.charAt(0).toUpperCase();
  }

  // Group friends by first letter
  $: groupedFriends = filteredFriends.reduce((acc, friend) => {
    const letter = getFirstLetter(friend.name);
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(friend);
    return acc;
  }, {});

  function toggleFriend(friend) {
    const index = selectedFriends.indexOf(friend.id);
    if (index === -1) {
      selectedFriends = [...selectedFriends, friend.id];
    } else {
      selectedFriends = selectedFriends.filter(id => id !== friend.id);
    }
  }

  function removeFriend(friendId) {
    selectedFriends = selectedFriends.filter(id => id !== friendId);
  }

  function selectGroup(group) {
    console.log('Selecting group:', group);
    if (selectedGroup?.id === group.id) {
      selectedGroup = null;
      selectedFriends = [];
    } else {
      selectedGroup = group;
      // Get member IDs from the group
      const memberIds = group.members.map(m => m.userId || m.id);
      console.log('Member IDs:', memberIds);
      selectedFriends = memberIds;
    }
    groupsExpanded = false;
  }

  function normalizeDate(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  function getStorageDateKey(date) {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  }

  function findAvailableSlots() {
    console.log('Finding slots for friends:', selectedFriends);
    const slots = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    if (selectedFriends.length === 0) {
      alert('Please select at least one friend');
      return;
    }

    // Get current user's availability
    const myAvailability = JSON.parse(localStorage.getItem('availability') || '{}');
    console.log('Current user availability:', myAvailability);

    // Get all friends' availability
    const friendsAvailability = {};
    for (const friendId of selectedFriends) {
      const availKey = `availability_${friendId}`;
      console.log('Checking availability for:', availKey);
      const savedAvailability = localStorage.getItem(availKey);
      if (savedAvailability) {
        friendsAvailability[friendId] = JSON.parse(savedAvailability);
      }
    }

    // Loop through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = normalizeDate(currentDate);
      const storageDate = getStorageDateKey(currentDate);
      
      // Check each time slot
      ['morning', 'afternoon', 'evening'].forEach(timeSlot => {
        let maybeCount = 0;
        let availableCount = 0;
        
        // Check each friend's availability
        for (const friendId of selectedFriends) {
          const friendAvail = friendsAvailability[friendId]?.[dateStr]?.[timeSlot];
          if (friendAvail === 'maybe') {
            maybeCount++;
          } else if (friendAvail === 'available') {
            availableCount++;
          }
        }

        // Check user's availability
        const userAvail = myAvailability[`${storageDate}_${timeSlot}`];
        if (userAvail === 1) {
          availableCount++;
        } else if (userAvail === 0) {
          maybeCount++;
        }

        // Calculate a score for this slot (weight available higher than maybe)
        const score = (availableCount * 2) + maybeCount;
        
        if (score > 0) {
          slots.push({
            date: dateStr,
            time: timeSlot,
            availableCount,
            maybeCount,
            score,
            votes: 0,
            votedBy: [], // Track who voted
            cannotMake: []
          });
        }
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Sort by score and take top 3
    slots.sort((a, b) => b.score - a.score);
    suggestedSlots = slots.slice(0, 3);
    
    if (suggestedSlots.length === 0) {
      alert('No available times found. Try selecting different dates or friends.');
    } else {
      step = 4;
      selectedSlot = suggestedSlots[0];
    }
  }

  function vote(slot) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    suggestedSlots = suggestedSlots.map(s => {
      if (s === slot) {
        // If user already voted, remove their vote
        if (s.votedBy.includes(userId)) {
          return {
            ...s,
            votes: s.votes - 1,
            votedBy: s.votedBy.filter(id => id !== userId)
          };
        }
        // Add their vote
        return {
          ...s,
          votes: s.votes + 1,
          votedBy: [...s.votedBy, userId]
        };
      }
      return s;
    });
  }

  function hasVoted(slot) {
    const userId = localStorage.getItem('userId');
    return slot.votedBy?.includes(userId);
  }

  function cannotMake(slot) {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    suggestedSlots = suggestedSlots.map(s => {
      if (s === slot) {
        if (s.cannotMake.includes(userId)) {
          return { ...s, cannotMake: s.cannotMake.filter(id => id !== userId) };
        } else {
          return { ...s, cannotMake: [...s.cannotMake, userId] };
        }
      }
      return s;
    });
  }

  function handleNext() {
    if (step === 1) {
      if (selectedFriends.length === 0) {
        alert('Please select at least one friend');
        return;
      }
      step = 2;
    } else if (step === 2) {
      if (!dateRange.start || !dateRange.end) {
        alert('Please select a date range');
        return;
      }
      step = 3;
    } else if (step === 3) {
      if (!hangName.trim()) {
        alert('Please give your Hang a name');
        return;
      }
      findAvailableSlots();
    } else if (step === 4) {
      if (!selectedSlot) {
        alert('Please select a time slot');
        return;
      }
      finalizeHang();
    }
  }

  function getTimeSlotLabel(slot) {
    const labels = {
      morning: '9:00 AM - 12:00 PM',
      afternoon: '12:00 PM - 5:00 PM',
      evening: '5:00 PM - 9:00 PM'
    };
    return labels[slot] || slot;
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  async function handleSubmit() {
    // Validate selections
    if (!selectedGroup && selectedFriends.length === 0) {
      alert('Please select at least one friend or group');
      return;
    }

    findAvailableSlots();
  }

  async function finalizeHang() {
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    finalizing = true;

    try {
      // Create the hang object
      const newHang = {
        id: crypto.randomUUID(),
        name: hangName,
        description: hangDescription,
        date: selectedSlot.date,
        timeSlot: selectedSlot.time,
        organizer: user.id,
        participants: selectedFriends,
        status: autoFinalize ? 'confirmed' : 'pending',
        votes: selectedSlot.votes,
        votedBy: selectedSlot.votedBy,
        cannotMake: selectedSlot.cannotMake,
        createdAt: new Date().toISOString()
      };

      // Store in localStorage
      const savedHangs = JSON.parse(localStorage.getItem('hangs') || '[]');
      savedHangs.push(newHang);
      localStorage.setItem('hangs', JSON.stringify(savedHangs));

      // Add to suggested hangs store
      addSuggestedHang(newHang);

      // Redirect to calendar
      goto('/calendar');
    } catch (error) {
      console.error('Error finalizing hang:', error);
      alert('Failed to create hang. Please try again.');
    } finally {
      finalizing = false;
    }
  }

  function getRecommendedSlot() {
    if (!suggestedSlots.length) return null;
    
    // Score each slot based on multiple factors
    const scoredSlots = suggestedSlots.map(slot => {
      let score = 0;
      
      // Votes are most important
      score += slot.votes * 3;
      
      // Penalize for people who can't make it
      score -= slot.cannotMake.length * 5;
      
      // Bonus for more "available" vs "maybe"
      score += slot.availableCount * 2;
      score += slot.maybeCount;
      
      return { ...slot, finalScore: score };
    });
    
    return scoredSlots.sort((a, b) => b.finalScore - a.finalScore)[0];
  }
</script>

<div class="max-w-2xl mx-auto p-4">
  <div class="text-center mb-8">
    <img src="/hang-logo.png" alt="Hang Logo" class="h-24 mx-auto mb-6">
    <h1 class="text-3xl font-bold">Request a Hang</h1>
  </div>
  
  <div class="mb-8">
    <div class="relative w-full h-2 bg-gray-200 rounded-full mb-2">
      <div class="absolute h-full bg-blue-600 rounded-full" style="width: {(step / 4) * 100}%"></div>
    </div>
    <div class="text-right text-sm text-gray-500">{step}/4</div>
  </div>

  {#if step === 1}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Who would you like to Hang with?</h2>

      <!-- Selected Friends Tags -->
      {#if selectedFriends.length > 0}
        <div class="flex flex-wrap gap-2 mb-4">
          {#each selectedFriends as friendId}
            {#if friends.find(f => f.id === friendId)}
              {@const friend = friends.find(f => f.id === friendId)}
              <div class="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1">
                <span>{friend.name}</span>
                <button 
                  class="ml-2 text-blue-600 hover:text-blue-800"
                  on:click={() => removeFriend(friendId)}
                >
                  ×
                </button>
              </div>
            {/if}
          {/each}
        </div>
      {/if}

      <!-- Search Combobox -->
      <div class="relative" use:clickOutside on:outclick={() => isComboboxOpen = false}>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search friends..."
          class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          on:focus={() => isComboboxOpen = true}
          on:click={() => isComboboxOpen = true}
        />
        {#if searchQuery}
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            on:click|stopPropagation={() => { 
              searchQuery = ''; 
              isComboboxOpen = false; 
            }}
          >
            ×
          </button>
        {/if}

        {#if isComboboxOpen}
          <div 
            class="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-96 overflow-auto"
          >
            <!-- Recent Contacts -->
            {#if recentContacts.length > 0 && !searchQuery}
              <div class="p-2">
                <h3 class="text-xs font-semibold text-gray-500 mb-2">Recent</h3>
                {#each recentContacts as friend}
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-md flex items-center justify-between"
                    on:click|stopPropagation={() => {
                      toggleFriend(friend);
                      if (!searchQuery) isComboboxOpen = false;
                    }}
                  >
                    <span>{friend.name}</span>
                    {#if selectedFriends.includes(friend.id)}
                      <span class="text-blue-600">✓</span>
                    {/if}
                  </button>
                {/each}
                <div class="border-b my-2"></div>
              </div>
            {/if}

            <!-- Alphabetical Groups -->
            {#each Object.entries(groupedFriends) as [letter, letterFriends]}
              <div class="relative">
                <div class="sticky top-0 bg-gray-50 px-4 py-1 text-xs font-semibold text-gray-500">
                  {letter}
                </div>
                {#each letterFriends as friend}
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center justify-between"
                    on:click|stopPropagation={() => {
                      toggleFriend(friend);
                      if (!searchQuery) isComboboxOpen = false;
                    }}
                  >
                    <span>{friend.name}</span>
                    {#if selectedFriends.includes(friend.id)}
                      <span class="text-blue-600">✓</span>
                    {/if}
                  </button>
                {/each}
              </div>
            {/each}

            {#if filteredFriends.length === 0}
              <div class="p-4 text-center text-gray-500">
                No friends found
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Groups Section -->
      <div class="mt-6">
        <h3 class="text-lg font-medium mb-3">Or select a group</h3>
        <div class="space-y-2">
          {#each groups as group}
            <button
              class="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 flex items-center justify-between"
              class:bg-blue-50={selectedGroup?.id === group.id}
              on:click={() => selectGroup(group)}
            >
              <div>
                <span class="font-medium">{group.name}</span>
                <p class="text-sm text-gray-500">{group.members.length} members</p>
              </div>
              {#if selectedGroup?.id === group.id}
                <span class="text-blue-600">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex justify-between mt-8">
        <button 
          class="px-6 py-2 text-gray-600 hover:text-gray-800"
          on:click={() => goto('/')}
        >
          Back
        </button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={selectedFriends.length === 0 && !selectedGroup}
          on:click={() => step = 2}
        >
          Next
        </button>
      </div>
    </div>
  {:else if step === 2}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">When would you like to Hang?</h2>
      
      <div class="bg-white rounded-lg shadow p-6">
        <div class="space-y-4">
          <div>
            <label for="startDate" class="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              id="startDate"
              bind:value={dateRange.start}
              min={new Date().toISOString().split('T')[0]}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
          </div>

          <div>
            <label for="endDate" class="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              id="endDate"
              bind:value={dateRange.end}
              min={dateRange.start}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
          </div>

          <div>
            <label for="duration" class="block text-sm font-medium text-gray-700">How long do you want to Hang? (hours)</label>
            <select
              id="duration"
              bind:value={duration}
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="3">3 hours</option>
              <option value="4">4 hours</option>
            </select>
          </div>
        </div>
      </div>

      <div class="mt-6 flex justify-between">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          on:click={() => step = 1}
        >
          Back
        </button>
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          on:click={handleNext}
          disabled={!dateRange.start || !dateRange.end}
        >
          Next
        </button>
      </div>
    </div>

  {:else if step === 3}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Name Your Hang</h2>

      <!-- Quick Suggestions -->
      <div class="mb-6">
        <label class="block text-sm font-medium text-gray-700 mb-2">Quick Suggestions</label>
        <div class="flex flex-wrap gap-2">
          {#each ['Coffee Break ☕', 'Lunch Meetup 🍽️', 'Game Night 🎮', 'Movie Night 🎬', 'Study Session 📚', 'Happy Hour 🍻'] as suggestion}
            <button
              type="button"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              on:click={() => hangName = suggestion}
            >
              {suggestion}
            </button>
          {/each}
        </div>
      </div>

      <!-- Custom Name Input -->
      <div>
        <label for="hangName" class="block text-sm font-medium text-gray-700">Custom Name</label>
        <input
          type="text"
          id="hangName"
          bind:value={hangName}
          placeholder="Give your hang a name"
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
      </div>

      <!-- Description (Optional) -->
      <div>
        <label for="hangDescription" class="block text-sm font-medium text-gray-700">
          Description (Optional)
        </label>
        <textarea
          id="hangDescription"
          bind:value={hangDescription}
          rows="3"
          placeholder="Add any additional details..."
          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        ></textarea>
      </div>

      <div class="mt-6 flex justify-between">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          on:click={() => step = 2}
        >
          Back
        </button>
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          on:click={handleNext}
          disabled={!hangName.trim()}
        >
          Next
        </button>
      </div>
    </div>

  {:else if step === 4}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Vote for a Time</h2>
      
      <!-- Time Slots -->
      <div class="space-y-4">
        {#each suggestedSlots as slot}
          <div class="bg-white shadow rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-medium">{formatDate(slot.date)}</p>
                <p class="text-gray-600">{getTimeSlotLabel(slot.time)}</p>
              </div>
              <div class="flex space-x-2">
                <button
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md {hasVoted(slot) ? 'text-white bg-green-600' : 'text-gray-700 bg-gray-100'} hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  on:click={() => vote(slot)}
                >
                  👍 {slot.votes}
                </button>
                <button
                  class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md {slot.cannotMake.includes(user.id) ? 'text-white bg-red-600' : 'text-gray-700 bg-gray-100'} hover:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  on:click={() => cannotMake(slot)}
                >
                  👎
                </button>
              </div>
            </div>
          </div>
        {/each}
      </div>

      <!-- Auto-finalize Option -->
      <div class="flex items-center">
        <input
          type="checkbox"
          id="autoFinalize"
          bind:checked={autoFinalize}
          class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
        >
        <label for="autoFinalize" class="ml-2 block text-sm text-gray-900">
          Automatically finalize with most voted time
        </label>
      </div>

      <div class="mt-6 flex justify-between">
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          on:click={() => step = 3}
        >
          Back
        </button>
        <button
          type="button"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          on:click={finalizeHang}
          disabled={finalizing}
        >
          {finalizing ? 'Creating Hang...' : 'Create Hang'}
        </button>
      </div>
    </div>
  {/if}

  <!-- Progress Indicator -->
  <div class="mt-8">
    <div class="flex justify-center items-center space-x-4">
      {#each ['Select Friends', 'Pick Dates', 'Name It', 'Vote Time'] as label, i}
        <div class="flex flex-col items-center">
          <div class="w-2.5 h-2.5 rounded-full {step === i + 1 ? 'bg-indigo-600' : 'bg-gray-300'} mb-2"></div>
          <span class="text-xs text-gray-600 {step === i + 1 ? 'font-medium' : ''}">{label}</span>
        </div>
        {#if i < 3}
          <div class="w-8 h-0.5 bg-gray-300"></div>
        {/if}
      {/each}
    </div>
  </div>
</div>
