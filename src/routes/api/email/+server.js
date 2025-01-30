// Email functionality temporarily disabled
export async function POST() {
    return new Response(
        JSON.stringify({
            success: true,
            message: 'Email functionality temporarily disabled'
        }),
        {
            headers: {
                'Content-Type': 'application/json'
            }
        }
    );
}
