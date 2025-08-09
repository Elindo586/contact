// app/page.js

'use client';

import { useState } from 'react';

export default function HomePage() {
  const [ngrokUrl, setNgrokUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to start ngrok via the API route
  const startNgrok = async () => {
    setLoading(true);
    setError(null);  // Reset error state

    try {
      const res = await fetch('/api/ngrok', {
        method: 'POST',
      });

      if (res.ok) {
        const data = await res.json();
        setNgrokUrl(data.url); // Set the ngrok URL to display
        console.log('ngrok URL:', data.url);
      } else {
        console.error('Failed to start ngrok');
        setError('Failed to start ngrok');
      }
    } catch (error) {
      console.error('Error triggering ngrok:', error);
      setError('Error triggering ngrok');
    }

    setLoading(false);
  };

  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Next.js + ngrok Example</h1>
      <button
        onClick={startNgrok}
        disabled={loading}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
        }}
      >
        {loading ? 'Starting ngrok...' : 'Start ngrok Tunnel'}
      </button>

      {ngrokUrl && (
        <div style={{ marginTop: '20px' }}>
          <p>Your public ngrok URL:</p>
          <a href={ngrokUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '18px', color: '#0070f3' }}>
            {ngrokUrl}
          </a>
        </div>
      )}

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}
