// Concurrent favicon fetcher that tries multiple sources per URL.

const CONCURRENCY = 6;

type FaviconResult = { iconData: string | null; iconURI: string | null };
type FaviconJob = {
  bookmarkId: string;
  url: string;
  resolve: (result: FaviconResult) => void;
};

const queue: FaviconJob[] = [];
let active = 0;
let onQueueChange: ((pending: number) => void) | null = null;

// Registers a callback that fires whenever the queue size changes.
export function setQueueChangeListener(fn: (pending: number) => void): void {
  onQueueChange = fn;
}

// Notifies the listener of the current total pending+active count.
function notifyChange(): void {
  onQueueChange?.(queue.length + active);
}

// Queues a favicon fetch job and returns a promise with the result.
export function queueIconFetch(bookmarkId: string, url: string): Promise<FaviconResult> {
  return new Promise((resolve) => {
    queue.push({ bookmarkId, url, resolve });
    notifyChange();
    processQueue();
  });
}

// Processes queued jobs up to the concurrency limit.
function processQueue(): void {
  while (active < CONCURRENCY && queue.length > 0) {
    const job = queue.shift()!;
    active++;
    notifyChange();
    getFaviconData(job.url)
      .then((result) => job.resolve(result))
      .catch(() => job.resolve({ iconData: null, iconURI: null }))
      .finally(() => {
        active--;
        notifyChange();
        processQueue();
      });
  }
}

// Tries multiple favicon sources and returns the first valid image as a data URL.
async function getFaviconData(url: string): Promise<FaviconResult> {
  const host = new URL(url).hostname;
  const candidates = [
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    `https://${host}/favicon.ico`,
  ];
  for (const iconURL of candidates) {
    try {
      const res = await fetch(iconURL, { mode: 'cors' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const dataURL = await blobToDataURL(blob);
      if (dataURL?.startsWith('data:image/')) {
        return { iconData: dataURL, iconURI: iconURL };
      }
    } catch {
      continue;
    }
  }
  return { iconData: null, iconURI: candidates[0] };
}

// Converts a Blob to a base64 data URL string.
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });
}
