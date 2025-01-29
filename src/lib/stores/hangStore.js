import { writable } from 'svelte/store';

// Load initial state from localStorage
const storedSuggestedHangs = JSON.parse(localStorage.getItem('suggestedHangs') || '[]');
const storedConfirmedHangs = JSON.parse(localStorage.getItem('confirmedHangs') || '[]');

export const suggestedHangs = writable(storedSuggestedHangs);
export const confirmedHangs = writable(storedConfirmedHangs);

// Subscribe to changes and update localStorage
suggestedHangs.subscribe(value => {
    localStorage.setItem('suggestedHangs', JSON.stringify(value));
});

confirmedHangs.subscribe(value => {
    localStorage.setItem('confirmedHangs', JSON.stringify(value));
});

export function addSuggestedHang(hang) {
    suggestedHangs.update(hangs => [...hangs, {
        id: crypto.randomUUID(),
        status: 'suggested',
        createdAt: new Date().toISOString(),
        ...hang
    }]);
}

export function confirmHang(hangId) {
    suggestedHangs.update(hangs => {
        const hang = hangs.find(h => h.id === hangId);
        if (hang) {
            confirmedHangs.update(confirmed => [...confirmed, {
                ...hang,
                status: 'confirmed',
                confirmedAt: new Date().toISOString()
            }]);
            return hangs.filter(h => h.id !== hangId);
        }
        return hangs;
    });
}

export function cancelHang(hangId, isSuggested = false) {
    if (isSuggested) {
        suggestedHangs.update(hangs => hangs.filter(h => h.id !== hangId));
    } else {
        confirmedHangs.update(hangs => hangs.filter(h => h.id !== hangId));
    }
}

export function updateHangParticipants(hangId, participants, isSuggested = true) {
    const store = isSuggested ? suggestedHangs : confirmedHangs;
    store.update(hangs => hangs.map(hang => 
        hang.id === hangId 
            ? { ...hang, participants } 
            : hang
    ));
}
