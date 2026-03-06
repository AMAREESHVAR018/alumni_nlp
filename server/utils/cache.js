// Simple TTL in-memory cache
const cache = new Map();
const TTL = 60 * 1000; // 1 minute default

module.exports = {
  get: (key) => {
    const item = cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) { cache.delete(key); return null; }
    return item.value;
  },
  set: (key, value, ttlMs = TTL) => {
    cache.set(key, { value, expiresAt: Date.now() + ttlMs });
  },
  del: (key) => cache.delete(key),
  clear: () => cache.clear()
};
