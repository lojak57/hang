import { json } from '@sveltejs/kit';
import sgMail from '@sendgrid/mail';
import { SENDGRID_API_KEY } from '$env/static/private';

const VERIFIED_SENDER = 'mitch.mechelay57@icloud.com';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    
    try {
        const { type, to, fromName, shareUrl, selectedTimes, requestUrl } = await request.json();

        if (type === 'invite') {
            const msg = {
                to,
                from: VERIFIED_SENDER,
                subject: `${fromName} wants to share their availability with you on Hang`,
                text: `${fromName} has invited you to view their availability on Hang!\n\nClick here to view their calendar: ${shareUrl}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">You've been invited to Hang!</h2>
                        <p>${fromName} has invited you to view their availability.</p>
                        <div style="margin: 24px 0;">
                            <a href="${shareUrl}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                View Calendar
                            </a>
                        </div>
                        <p style="color: #666;">Hang - Simple group scheduling</p>
                    </div>
                `
            };
            await sgMail.send(msg);
        } else if (type === 'request') {
            const timesList = selectedTimes
                .map(time => `• ${time.date} - ${time.timeSlot}`)
                .join('\n');
                
            const msg = {
                to,
                from: VERIFIED_SENDER,
                subject: `${fromName} wants to hang out!`,
                text: `${fromName} has invited you to hang out!\n\nProposed times:\n${timesList}\n\nRespond here: ${requestUrl}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #2563eb;">${fromName} wants to hang out!</h2>
                        <p>Here are the proposed times:</p>
                        <ul style="list-style: none; padding: 0;">
                            ${selectedTimes.map(time => `
                                <li style="padding: 12px; background: #f3f4f6; margin: 8px 0; border-radius: 4px;">
                                    ${time.date} - ${time.timeSlot}
                                </li>
                            `).join('')}
                        </ul>
                        <div style="margin: 24px 0;">
                            <a href="${requestUrl}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                                Respond to Request
                            </a>
                        </div>
                        <p style="color: #666;">Hang - Simple group scheduling</p>
                    </div>
                `
            };
            await sgMail.send(msg);
        }

        return json({ success: true });
    } catch (error) {
        console.error('SendGrid error:', error);
        return json({ success: false, error: error.message }, { status: 500 });
    }
}
