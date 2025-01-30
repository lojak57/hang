import { writable } from 'svelte/store';

// Get or initialize current user from localStorage
const storedUser = localStorage.getItem('currentUser');
const defaultUser = {
    id: crypto.randomUUID(),
    name: 'You',
    phone: ''
};

export const currentUser = writable(storedUser ? JSON.parse(storedUser) : defaultUser);

// Subscribe to changes and update localStorage
currentUser.subscribe(value => {
    localStorage.setItem('currentUser', JSON.stringify(value));
});
