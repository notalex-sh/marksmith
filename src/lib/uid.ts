// Generates short unique IDs for tree nodes.

// Returns a random ID combining Math.random and timestamp.
export function uid(): string {
  return 'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
