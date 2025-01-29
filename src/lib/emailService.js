// Client-side email service that calls our API endpoint
export async function sendInviteEmail(to, fromName, shareUrl) {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'invite',
                to,
                fromName,
                shareUrl
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}

export async function sendHangRequestEmail(to, fromName, selectedTimes, requestUrl) {
    try {
        const response = await fetch('/api/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'request',
                to,
                fromName,
                selectedTimes,
                requestUrl
            })
        });
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.error);
        }
        
        return { success: true };
    } catch (error) {
        console.error('Email error:', error);
        return { success: false, error: error.message };
    }
}
