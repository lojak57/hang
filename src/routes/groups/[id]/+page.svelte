<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { currentUser } from '$lib/stores/currentUser';

  let group = null;
  let user;
  currentUser.subscribe(value => {
    user = value;
  });

  onMount(() => {
    const groupId = $page.params.id;
    const savedGroups = localStorage.getItem('friendGroups');
    if (savedGroups) {
      const groups = JSON.parse(savedGroups);
      group = groups.find(g => g.id === groupId);
      
      // If user isn't a member, they shouldn't be here
      if (group && !group.members.some(m => m.id === user.id)) {
        group = null;
      }
    }
  });

  function getStatusBadgeClass(status) {
    return status === 'owner' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-gray-100 text-gray-800';
  }
</script>

{#if group}
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <div class="flex justify-between items-start mb-8">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">{group.name}</h1>
          {#if group.description}
            <p class="mt-2 text-gray-600">{group.description}</p>
          {/if}
        </div>
        
        {#if group.members.find(m => m.id === user.id)?.status === 'owner'}
          <button
            class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            on:click={() => {
              const savedGroups = localStorage.getItem('friendGroups');
              if (savedGroups) {
                const groups = JSON.parse(savedGroups);
                const updatedGroups = groups.filter(g => g.id !== group.id);
                localStorage.setItem('friendGroups', JSON.stringify(updatedGroups));
                goto('/groups');
              }
            }}
          >
            Delete Group
          </button>
        {/if}
      </div>

      <div class="space-y-6">
        <div>
          <h2 class="text-lg font-medium text-gray-900 mb-4">Members</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {#each group.members as member}
              <div class="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span class="text-gray-600 font-medium">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </p>
                </div>
                <div class="flex-shrink-0">
                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(member.status)}`}>
                    {member.status}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
    <h1 class="text-xl text-gray-600 mb-4">Group not found</h1>
    <a 
      href="/groups"
      class="text-blue-600 hover:text-blue-800"
    >
      Back to Groups
    </a>
  </div>
{/if}
