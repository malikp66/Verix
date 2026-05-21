/**
 * Resolves after a random delay between 1200ms and 3000ms.
 * Simulates human typing/thinking behavior to prevent bot detection and bans on WhatsApp.
 */
export function humanDelay(): Promise<void> {
  const delay = 1200 + Math.random() * 1800;
  return new Promise((resolve) => setTimeout(resolve, delay));
}
