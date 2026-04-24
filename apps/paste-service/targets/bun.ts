import { homedir } from "os";
import { join } from "path";
import { handleRequest } from "../core/handler";
import { corsHeaders, getAllowedOrigins } from "../core/cors";
import { FsPasteStore } from "../stores/fs";

function getCacheDir(): string {
  const dir =
    process.env.PLANNOTATOR_CACHE_DIR ||
    (process.env.XDG_CACHE_HOME && join(process.env.XDG_CACHE_HOME, "plannotator")) ||
    join(homedir(), ".cache", "plannotator");
  return dir;
}

const port = parseInt(process.env.PASTE_PORT || "19433", 10);
const dataDir = process.env.PASTE_DATA_DIR || join(getCacheDir(), "pastes");
const ttlDays = parseInt(process.env.PASTE_TTL_DAYS || "7", 10);
const ttlSeconds = ttlDays * 24 * 60 * 60;
const maxSize = parseInt(process.env.PASTE_MAX_SIZE || "524288", 10);
const allowedOrigins = getAllowedOrigins(process.env.PASTE_ALLOWED_ORIGINS);

const store = new FsPasteStore(dataDir);

Bun.serve({
  port,
  async fetch(request) {
    const origin = request.headers.get("Origin") ?? "";
    const cors = corsHeaders(origin, allowedOrigins);
    return handleRequest(request, store, cors, { maxSize, ttlSeconds });
  },
});

console.log(`Plannotator paste service running on http://localhost:${port}`);
console.log(`Storage: ${dataDir}`);
console.log(`TTL: ${ttlDays} days`);
