// src/replayStore.js
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const STORE_PATH = process.env.REPLAY_STORE_PATH ?? './.data/replay-id';

export async function loadReplayId() {
  try {
    const raw = await readFile(STORE_PATH, 'utf8');
    const parsed = Number.parseInt(raw.trim(), 10);
    return Number.isInteger(parsed) ? parsed : null;
  } catch (err) {
    if (err.code === 'ENOENT') return null;   // pierwszy start — brak zapisanej pozycji
    throw err;
  }
}

export async function saveReplayId(replayId) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, String(replayId), 'utf8');
}