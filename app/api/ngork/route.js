// app/api/ngrok/route.js
import ngrok from 'ngrok';

export async function POST() {
  try {
    // Start ngrok on port 3000 (Next.js default dev port)
    console.log('Starting ngrok...');
    const url = await ngrok.connect(3000);
    console.log(`ngrok tunnel started at ${url}`);

    // Return the public ngrok URL
    return new Response(
      JSON.stringify({ message: 'ngrok tunnel started', url }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error starting ngrok:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to start ngrok' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
