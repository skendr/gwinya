import * as SecureStore from "expo-secure-store";

/**
 * SecureStore-backed key/value adapter for the Supabase auth client.
 *
 * iOS keychain items are capped (~2 KB). A Supabase session (access + refresh
 * JWT) can exceed that, so large values are transparently split across
 * numbered chunk keys with a small "marker" stored under the main key. Small
 * values are stored directly. Everything stays in the secure keychain.
 */

const CHUNK_SIZE = 1800; // bytes-safe headroom under the ~2 KB keychain limit
const CHUNK_MARKER = "@gwinya-chunks:";

const chunkKey = (key: string, i: number) => `${key}__${i}`;

async function removeChunks(key: string): Promise<void> {
  const head = await SecureStore.getItemAsync(key);
  if (head == null || !head.startsWith(CHUNK_MARKER)) return;
  const count = Number(head.slice(CHUNK_MARKER.length));
  if (!Number.isFinite(count)) return;
  for (let i = 0; i < count; i++) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
}

export const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const head = await SecureStore.getItemAsync(key);
    if (head == null) return null;
    if (!head.startsWith(CHUNK_MARKER)) return head;

    const count = Number(head.slice(CHUNK_MARKER.length));
    if (!Number.isFinite(count)) return null;
    let value = "";
    for (let i = 0; i < count; i++) {
      const part = await SecureStore.getItemAsync(chunkKey(key, i));
      if (part == null) return null; // corrupt/partial — force re-auth
      value += part;
    }
    return value;
  },

  async setItem(key: string, value: string): Promise<void> {
    await removeChunks(key);
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
      );
    }
    await SecureStore.setItemAsync(key, `${CHUNK_MARKER}${count}`);
  },

  async removeItem(key: string): Promise<void> {
    await removeChunks(key);
    await SecureStore.deleteItemAsync(key);
  },
};
