import { json } from '@sveltejs/kit';

// Email functionality temporarily disabled
export async function POST({ request }) {
    console.log('Email endpoint called - functionality temporarily disabled');
    return json({
        success: true,
        message: 'Email functionality temporarily disabled'
    });
}
