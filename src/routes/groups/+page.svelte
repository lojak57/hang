<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/currentUser';

  let user;
  currentUser.subscribe(value => {
    user = value;
  });

  let groups = [];
  let newGroup = {
    name: '',
    description: ''
  };
  let selectedFriends = [];
  let friends = [];
  let editingGroup = null;
  let showManageModal = false;
  let tempSelectedMembers = [];

  onMount(async () => {
    // Load friends first
    const savedFriends = localStorage.getItem('friends');
    if (savedFriends) {
      friends = JSON.parse(savedFriends);
    }

    // Load and migrate groups if needed
    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      groups = JSON.parse(savedGroups);
    }
  });

  function createGroup() {
    if (!newGroup.name.trim()) {
      alert('Please enter a group name');
      return;
    }

    const members = [
      {
        id: user.id,
        name: user.name,
        email: user.email,
        status: 'owner'
      }
    ];

    // Add selected friends
    for (let friend of selectedFriends) {
      members.push({
        id: friend.id,
        name: friend.name,
        email: friend.email,
        status: 'member'
      });
    }

    const newGroupId = crypto.randomUUID();
    const newGroupData = {
      id: newGroupId,
      name: newGroup.name.trim(),
      description: newGroup.description,
      members,
      createdAt: new Date().toISOString()
    };

    groups = [...groups, newGroupData];
    localStorage.setItem('friendGroups', JSON.stringify(groups));

    // Reset form
    newGroup.name = '';
    newGroup.description = '';
    selectedFriends = [];
  }

  function handleGroupClick(group) {
    window.location.href = `/groups/${group.id}`;
  }

  function deleteGroup(id, event) {
    event.stopPropagation();
    groups = groups.filter(g => g.id !== id);
    localStorage.setItem('friendGroups', JSON.stringify(groups));
  }

  function toggleFriendSelection(friend) {
    const index = selectedFriends.indexOf(friend);
    if (index === -1) {
      selectedFriends = [...selectedFriends, friend];
    } else {
      selectedFriends = selectedFriends.filter(f => f !== friend);
    }
  }
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white rounded-2xl shadow-xl p-8">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Friend Groups</h1>
    </div>

    <!-- Group Cards -->
    <div class="grid grid-cols-1 gap-6 mb-8">
      {#each groups as group}
        <button
          type="button"
          class="relative w-full text-left bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-500 cursor-pointer transition-colors duration-200"
          on:click={() => handleGroupClick(group)}
          on:keydown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleGroupClick(group);
            }
          }}
          aria-label="View group {group.name}"
        >
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{group.name}</h3>
              {#if group.description}
                <p class="mt-1 text-sm text-gray-500">{group.description}</p>
              {/if}
            </div>
            <div class="flex space-x-2">
              <button
                type="button"
                class="text-blue-600 hover:text-blue-800"
                on:click|stopPropagation={() => {
                  editingGroup = group;
                  tempSelectedMembers = group.members.map(m => m.id);
                  showManageModal = true;
                }}
                aria-label="Edit group {group.name}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
              <button
                type="button"
                class="text-red-600 hover:text-red-800"
                on:click|stopPropagation={() => deleteGroup(group.id)}
                aria-label="Delete group {group.name}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <h4 class="text-sm font-medium text-gray-700">Members ({group.members.length})</h4>
            <div class="flex flex-wrap gap-2">
              {#each group.members as member}
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium {member.status === 'owner' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                  {member.name}
                  {#if member.status === 'owner'}
                    <span class="ml-1 text-xs text-blue-600">(owner)</span>
                  {/if}
                </span>
              {/each}
            </div>
          </div>
        </button>
      {/each}
    </div>

    <!-- Create Group Form -->
    <div id="createGroupForm" class="bg-gray-50 rounded-xl p-6 mt-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Create New Group</h2>
        <div class="h-px flex-1 bg-gray-200 mx-4"></div>
      </div>

      <div class="space-y-4">
        <div>
          <label for="groupName" class="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
          <input
            id="groupName"
            type="text"
            bind:value={newGroup.name}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            required
            aria-required="true"
          />
        </div>

        <div>
          <label for="groupDescription" class="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
          <input
            id="groupDescription"
            type="text"
            bind:value={newGroup.description}
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label for="friendSelect" class="block text-sm font-medium text-gray-700 mb-2">Select Friends</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {#each friends as friend}
              <label class="relative flex items-center p-3 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  bind:group={selectedFriends}
                  value={friend}
                />
                <span class="ml-3 text-sm font-medium text-gray-900">{friend.name}</span>
              </label>
            {/each}
          </div>
        </div>

        <div class="flex justify-end">
          <button
            on:click={createGroup}
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
