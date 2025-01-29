import { writable } from 'svelte/store';

// Get or create a user ID
let userId = localStorage.getItem('userId');
if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('userId', userId);
}

export const currentUserId = writable(userId);
