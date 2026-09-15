import { useEffect, useState } from 'react';

const apiUrl = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

// Health status is informational: local listening and recording must remain usable.
export function PracticeNote({ audioError }: { audioError: boolean }) {
  const [connection, setConnection] = useState<'checking' | 'ready' | 'unavailable'>('checking');

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = window.setTimeout(() => controller.abort(), 15_000);

    async function checkConnection() {
      try {
        const response = await fetch(`${apiUrl}/health`, { signal: controller.signal });
        if (!response.ok || (await response.json()).status !== 'ok') {
          throw new Error('Service unavailable');
        }
        if (active) setConnection('ready');
      } catch {
        if (active) setConnection('unavailable');
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkConnection();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);


  return (
        <div className="preview-note" id="preview-note">
          <span className="preview-label">Synthetic reference · Preview</span>
          {audioError && <p role="alert">Could not play the reference audio. Please try again.</p>}
          <p role="status">
            {connection === 'checking' && 'Connecting to the practice service…'}
            {connection === 'ready' && 'Live matching is coming next.'}
            {connection === 'unavailable' && 'The practice service is unavailable. Listening and recording still work locally.'}
          </p>
        </div>
  );
}
