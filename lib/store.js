// =================================================
// SESSION STORE
// Remembers which agent each WhatsApp user picked.
//
// On Vercel, memory is wiped between cold starts and is not shared
// between instances, so connect Upstash Redis (Vercel Marketplace ->
// Upstash -> Redis). That sets KV_REST_API_URL / KV_REST_API_TOKEN
// (or UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN) automatically.
// Without it, an in-memory fallback is used (fine for local testing).
// =================================================
const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const TTL_SECONDS = 60 * 60 * 24; // forget a session after 24h idle

const memory = new Map();

async function redis(command) {
  const res = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis error ${res.status}`);
  return (await res.json()).result;
}

const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

async function get(user) {
  const key = `wa:session:${user}`;
  if (!useRedis) return memory.get(key) || null;
  const raw = await redis(["GET", key]);
  return raw ? JSON.parse(raw) : null;
}

async function set(user, value) {
  const key = `wa:session:${user}`;
  if (!useRedis) return void memory.set(key, value);
  await redis(["SET", key, JSON.stringify(value), "EX", TTL_SECONDS]);
}

async function clear(user) {
  const key = `wa:session:${user}`;
  if (!useRedis) return void memory.delete(key);
  await redis(["DEL", key]);
}

module.exports = { get, set, clear, useRedis };
