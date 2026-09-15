import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import App from './App';

afterEach(() => vi.restoreAllMocks());

test('offers listening and recording', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))));
  render(<App />);
  expect(await screen.findByText('Live matching is coming next.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /speak/i })).toBeEnabled();
  expect(screen.getByRole('button', { name: /listen/i })).toBeEnabled();
});

test('plays the reference without a backend, pauses, and resets after ending', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Offline')));
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (this: HTMLMediaElement) {
    fireEvent.play(this);
    return Promise.resolve();
  });
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (this: HTMLMediaElement) {
    fireEvent.pause(this);
  });
  render(<App />);
  await screen.findByText(/practice service is unavailable/i);
  fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
  fireEvent.click(await screen.findByRole('button', { name: 'Pause' }));
  expect(screen.getByRole('button', { name: 'Listen' })).toBeEnabled();
  fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
  fireEvent.ended(screen.getByLabelText('Reference audio'));
  expect(screen.getByRole('button', { name: 'Listen' })).toBeEnabled();
});

test('shows a recoverable message when audio playback fails', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }))));
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new Error('Audio unavailable'));
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Listen' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Could not play the reference audio. Please try again.');
  expect(screen.getByRole('button', { name: 'Listen' })).toBeEnabled();
});

test('keeps the practice preview visible when the backend cannot be reached', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
  render(<App />);
  expect(await screen.findByText(/practice service is unavailable/i)).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Hej, hur mår du?' })).toBeInTheDocument();
});

test('does not treat an HTTP error as a healthy service', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
  render(<App />);
  expect(await screen.findByText(/practice service is unavailable/i)).toBeInTheDocument();
});
