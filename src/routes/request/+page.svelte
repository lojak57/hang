<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { addSuggestedHang } from '$lib/stores/hangStore';
  import { currentUser } from '$lib/stores/currentUser';

  let friends = [];
  let groups = [];
  let selectedFriends = [];
  let selectedGroup = null;
  let groupsExpanded = false;
  let individualsExpanded = false;
  let dateRange = { start: '', end: '' };
  let suggestedSlots = [];
  let selectedSlot = null;
  let step = 1;
  let isSending = false;
  let emailStatus = '';
  let activity = '';
  let location = '';
  let locationDetails = '';
  let description = '';
  let user;
  let duration = '2'; // hours
  let pollDeadline = '';
  let autoFinalize = false;
  let notifyReminders = false;
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

  function toggleFriendSelection(friendId) {
    console.log('Toggling friend:', friendId);
    const index = selectedFriends.indexOf(friendId);
    if (index === -1) {
      selectedFriends = [...selectedFriends, friendId];
    } else {
      selectedFriends = selectedFriends.filter(id => id !== friendId);
    }
    // Clear selected group if manual selection
    selectedGroup = null;
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
      step = 2;
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
      step = 1.5; // New naming step
    } else if (step === 1.5) {
      if (!hangName.trim()) {
        alert('Please give your Hang a name');
        return;
      }
      findAvailableSlots();
    } else if (step === 2) {
      if (!selectedSlot) {
        alert('Please select a time slot');
        return;
      }
      step = 3;
    } else if (step === 3) {
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

    if (!dateRange.start || !dateRange.end) {
      alert('Please select a date range');
      return;
    }

    // Create the poll
    const pollData = {
      group: selectedGroup,
      friends: selectedFriends,
      dateRange,
      duration,
      pollDeadline,
      autoFinalize
    };

    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pollData)
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const { id } = await response.json();
      goto(`/polls/${id}`);
    } catch (err) {
      console.error('Error creating poll:', err);
      alert('Failed to create poll. Please try again.');
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

  function setPollDeadline() {
    // Default to 24 hours from now
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 24);
    pollDeadline = deadline.toISOString().slice(0, 16); // Format for datetime-local input
  }

  function finalizeHang() {
    finalizing = true;
    const recommendedSlot = getRecommendedSlot();
    
    // Save the Hang details
    const hang = {
      id: crypto.randomUUID(),
      name: hangName,
      description: hangDescription,
      creator: localStorage.getItem('userId'),
      group: selectedGroup,
      friends: selectedFriends,
      slots: suggestedSlots,
      selectedSlot: recommendedSlot,
      createdAt: new Date().toISOString(),
      status: autoFinalize ? 'pending' : 'finalized',
      pollDeadline: new Date(pollDeadline).toISOString(),
      autoFinalize,
      notifyReminders
    };
    
    // Save to localStorage
    const hangs = JSON.parse(localStorage.getItem('hangs') || '[]');
    hangs.push(hang);
    localStorage.setItem('hangs', JSON.stringify(hangs));
    
    // Navigate to success page after short delay
    setTimeout(() => {
      goto('/hang/success');
    }, 1000);
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
    <div class="space-y-4 mb-8">
      <!-- Groups Dropdown -->
      <div class="relative">
        <label for="groups" class="block text-sm font-medium text-gray-700 mb-1">Groups</label>
        <button
          type="button"
          id="groups"
          aria-haspopup="true"
          aria-expanded={groupsExpanded}
          class="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-left flex justify-between items-center hover:border-gray-400 transition-colors"
          on:click={() => {
            groupsExpanded = !groupsExpanded;
            individualsExpanded = false; // Close other dropdown
          }}
        >
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-900 mr-2">Groups</span>
            {#if selectedGroup}
              <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {selectedGroup.name}
              </span>
            {/if}
          </div>
          <svg
            class="w-5 h-5 text-gray-400 transform transition-transform duration-200 {groupsExpanded ? 'rotate-180' : ''}"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        {#if groupsExpanded}
          <div 
            role="listbox"
            tabindex="0"
            class="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
            on:click|stopPropagation
            on:keydown={e => {
              if (e.key === 'Escape') groupsExpanded = false;
              if (e.key === 'Enter') handleGroupSelect(e.target.dataset.value);
            }}
          >
            <div class="p-2 space-y-1 max-h-60 overflow-y-auto">
              {#each groups as group}
                <button
                  type="button"
                  class="w-full flex items-center p-3 hover:bg-gray-50 rounded-lg {selectedGroup?.id === group.id ? 'bg-blue-50' : ''}"
                  on:click|stopPropagation={() => selectGroup(group)}
                  role="option"
                  aria-selected={selectedGroup?.id === group.id}
                  data-value={group.id}
                >
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">{group.name}</div>
                    <div class="text-xs text-gray-500">{group.members.length} members</div>
                  </div>
                  {#if selectedGroup?.id === group.id}
                    <svg class="w-5 h-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  {/if}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Individuals Dropdown -->
      <div class="relative">
        <label for="individuals" class="block text-sm font-medium text-gray-700 mb-1">Individuals</label>
        <button
          type="button"
          id="individuals"
          aria-haspopup="true"
          aria-expanded={individualsExpanded}
          class="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 text-left flex justify-between items-center hover:border-gray-400 transition-colors"
          on:click={() => {
            individualsExpanded = !individualsExpanded;
            groupsExpanded = false; // Close other dropdown
          }}
        >
          <div class="flex items-center">
            <span class="text-sm font-medium text-gray-900 mr-2">Individuals</span>
            {#if selectedCount > 0}
              <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {selectedCount} selected
              </span>
            {/if}
          </div>
          <svg
            class="w-5 h-5 text-gray-400 transform transition-transform duration-200 {individualsExpanded ? 'rotate-180' : ''}"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
            />
          </svg>
        </button>

        {#if individualsExpanded}
          <div 
            role="listbox"
            tabindex="0"
            class="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg"
            on:click|stopPropagation
            on:keydown={e => {
              if (e.key === 'Escape') individualsExpanded = false;
              if (e.key === 'Enter') handleFriendSelect(e.target.dataset.value);
            }}
          >
            <div class="p-2 space-y-1 max-h-60 overflow-y-auto">
              {#each friends as friend}
                <label class="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                  <div class="flex-1">
                    <div class="text-sm font-medium text-gray-900">{friend.name}</div>
                    <div class="text-xs text-gray-500">{friend.email}</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedFriends.includes(friend.id)}
                    on:change={() => toggleFriendSelection(friend.id)}
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    data-value={friend.id}
                  />
                </label>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>

    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-xl font-semibold mb-4">When would you like to Hang?</h2>
      
      <div class="space-y-4">
        <div>
          <label for="startDate" class="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input
            id="startDate"
            type="date"
            bind:value={dateRange.start}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label for="endDate" class="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            id="endDate"
            type="date"
            bind:value={dateRange.end}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label for="hangDuration" class="block text-sm font-medium text-gray-700 mb-1">How long do you want to Hang? (hours)</label>
          <select
            id="hangDuration"
            bind:value={duration}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1">1 hour</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
          </select>
        </div>
      </div>
    </div>

    <div class="flex justify-between items-center">
      <a href="/friends" class="text-blue-600 hover:text-blue-700">
        Add More Friends
      </a>
      <button
        class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        on:click={handleNext}
        disabled={selectedFriends.length === 0}
      >
        Find Available Times
      </button>
    </div>
  {:else if step === 1.5}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Name Your Hang</h2>
      
      <!-- Selected Friends Summary -->
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <p class="text-sm text-blue-800">
          {#if selectedGroup}
            Planning a Hang with {selectedGroup.name}
          {:else}
            Planning a Hang with {selectedFriends.length} selected friend{selectedFriends.length === 1 ? '' : 's'}
          {/if}
        </p>
      </div>

      <!-- Name Input -->
      <div class="space-y-4">
        <div>
          <label for="hangName" class="block text-sm font-medium text-gray-700 mb-1">
            What should we call this Hang? *
          </label>
          <input
            id="hangName"
            type="text"
            bind:value={hangName}
            placeholder="e.g., Weekly Coffee, Game Night, Birthday Dinner"
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          >
        </div>

        <div>
          <label for="hangDescription" class="block text-sm font-medium text-gray-700 mb-1">
            Add a description (optional)
          </label>
          <textarea
            id="hangDescription"
            bind:value={hangDescription}
            placeholder="e.g., Let's catch up over coffee! I found this new spot downtown."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8">
        <button
          class="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          on:click={() => step = 1}
        >
          Back
        </button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          on:click={handleNext}
          disabled={!hangName.trim()}
        >
          Next
        </button>
      </div>
    </div>
  {:else if step === 2}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Vote for a Time</h2>
      
      <!-- Selected Group Summary -->
      <div class="bg-blue-50 p-4 rounded-lg mb-4">
        <p class="text-sm text-blue-800">
          {#if selectedGroup}
            Top 3 times for {selectedGroup.name}
          {:else}
            Top 3 times for {selectedFriends.length} selected friend{selectedFriends.length === 1 ? '' : 's'}
          {/if}
        </p>
      </div>

      <!-- Available Slots -->
      <div class="grid grid-cols-1 gap-6">
        {#each suggestedSlots as slot}
          <div class="bg-white rounded-lg border p-4 relative {slot.cannotMake.includes(localStorage.getItem('userId')) ? 'opacity-50' : ''}">
            <div class="flex justify-between items-start">
              <div>
                <div class="font-medium text-gray-900">{formatDate(slot.date)}</div>
                <div class="text-gray-600">{getTimeSlotLabel(slot.time)}</div>
                <div class="text-sm text-gray-500 mt-1">
                  {slot.availableCount} available • {slot.maybeCount} maybe
                </div>
              </div>
              <div class="flex items-center space-x-4">
                <button
                  class="flex items-center space-x-2 px-4 py-2 {hasVoted(slot) ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'} rounded-lg hover:opacity-80 transition-colors"
                  on:click={() => vote(slot)}
                >
                  <span>👍</span>
                  <span>{slot.votes}</span>
                </button>
                <button
                  class="flex items-center space-x-2 px-4 py-2 {slot.cannotMake.includes(localStorage.getItem('userId')) ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-800'} rounded-lg hover:opacity-80 transition-colors"
                  on:click={() => cannotMake(slot)}
                >
                  {#if slot.cannotMake.includes(localStorage.getItem('userId'))}
                    <span>✕</span>
                  {:else}
                    <span>Can't make it</span>
                  {/if}
                </button>
              </div>
            </div>
            {#if slot.cannotMake.length > 0}
              <div class="text-sm text-red-500 mt-2">
                {slot.cannotMake.length} people can't make this time
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Navigation Buttons -->
      <div class="flex justify-between mt-8">
        <button
          class="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          on:click={() => step = 1.5}
        >
          Back
        </button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          on:click={handleNext}
          disabled={suggestedSlots.every(slot => slot.cannotMake.includes(localStorage.getItem('userId')))}
        >
          Next
        </button>
      </div>
    </div>
  {:else if step === 3}
    <div class="space-y-6">
      <h2 class="text-xl font-semibold mb-4">Finalize the Hang</h2>
      
      <!-- Summary Card -->
      <div class="bg-white rounded-lg border p-6 space-y-4">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-medium text-gray-900">
              {selectedGroup ? selectedGroup.name : `Hang with ${selectedFriends.length} friends`}
            </h3>
            <p class="text-sm text-gray-500">Based on votes and availability</p>
          </div>
          {#if finalizing}
            <div class="animate-pulse text-blue-600">
              Finalizing Hang...
            </div>
          {/if}
        </div>

        <!-- Recommended Time -->
        {#if getRecommendedSlot()}
          {@const recommended = getRecommendedSlot()}
          <div class="bg-green-50 rounded-lg p-4 mt-4">
            <div class="flex items-start">
              <div class="flex-shrink-0">
                <span class="text-green-400 text-xl">✨</span>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Recommended Time
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p class="font-medium">{formatDate(recommended.date)}</p>
                  <p>{getTimeSlotLabel(recommended.time)}</p>
                  <div class="mt-1 text-sm">
                    <span class="text-green-600">{recommended.votes} votes</span>
                    {#if recommended.cannotMake.length}
                      <span class="text-red-600"> • {recommended.cannotMake.length} can't make it</span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/if}

        <!-- Poll Settings -->
        <div class="space-y-4 pt-4">
          <div>
            <label for="pollDeadline" class="block text-sm font-medium text-gray-700 mb-1">
              Poll Deadline
            </label>
            <input
              id="pollDeadline"
              type="datetime-local"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              bind:value={pollDeadline}
              on:focus={() => !pollDeadline && setPollDeadline()}
            />
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="autoFinalize"
              bind:checked={autoFinalize}
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="autoFinalize" class="ml-2 text-sm text-gray-900">
              Automatically finalize at deadline with most voted time
            </label>
          </div>

          <div class="flex items-center">
            <input
              type="checkbox"
              id="notifyReminders"
              bind:checked={notifyReminders}
              class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="notifyReminders" class="ml-2 text-sm text-gray-900">
              Send reminders to friends who haven't voted
            </label>
          </div>
        </div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8">
        <button
          class="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          on:click={() => step = 2}
        >
          Back
        </button>
        <button
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          on:click={handleSubmit}
          disabled={!pollDeadline || finalizing}
        >
          {finalizing ? 'Creating Hang...' : 'Create Hang'}
        </button>
      </div>
    </div>
  {/if}
</div>
