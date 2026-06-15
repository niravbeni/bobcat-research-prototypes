import "server-only";
import Redis from "ioredis";
import { promises as fs } from "fs";
import path from "path";
import { DEFAULT_TEXTS, type PriorityText } from "./priorities";

// Single document holding the editable wording for every priority.
const KEY = "bobcat:priorities:texts:v1";

// Local-dev fallback so edits persist without a database while running locally.
// (On Vercel the filesystem is read-only, so a Redis URL must be configured.)
const FILE = path.join(process.cwd(), ".data", "content.json");

// Reuse one client across warm serverless invocations.
let client: Redis | null = null;
let initialised = false;

function getRedis(): Redis | null {
  if (initialised) return client;
  initialised = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return client;
  }

  client = new Redis(url, {
    maxRetriesPerRequest: 2,
    connectTimeout: 8000,
    // TLS providers use rediss://; ioredis enables TLS from the scheme.
  });
  // Prevent an unhandled connection error from crashing the server.
  client.on("error", () => {});
  return client;
}

export function hasDatabase(): boolean {
  return Boolean(process.env.REDIS_URL);
}

export async function loadTexts(): Promise<PriorityText[]> {
  const redis = getRedis();
  if (redis) {
    try {
      const raw = await redis.get(KEY);
      if (raw) {
        const data = JSON.parse(raw) as PriorityText[];
        if (Array.isArray(data) && data.length > 0) return data;
      }
    } catch {
      // fall through to defaults
    }
    return DEFAULT_TEXTS;
  }

  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw) as PriorityText[];
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // no file yet
  }
  return DEFAULT_TEXTS;
}

export async function saveTexts(texts: PriorityText[]): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(KEY, JSON.stringify(texts));
    return;
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(texts, null, 2), "utf8");
}

export async function resetTexts(): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(KEY);
    return;
  }
  try {
    await fs.unlink(FILE);
  } catch {
    // already gone
  }
}
