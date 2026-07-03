export function hashSeed(input) {
  const text = String(input || "real-estate-tycoon");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0 || 1;
}

export function createSeededRng(seed, state = null) {
  let current = Number.isFinite(state) ? state >>> 0 : hashSeed(seed);
  return {
    seed: String(seed || "real-estate-tycoon"),
    next() {
      current = (current + 0x6d2b79f5) >>> 0;
      let value = current;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    },
    getState() {
      return current >>> 0;
    }
  };
}

export function seedFromDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `daily-${year}${month}${day}`;
}
