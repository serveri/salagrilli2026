// Client-side flag validation + reward reveal, no server involved.
//
// Each challenge ships { salt, iv, ct } (see src/data/challenges.js). We derive
// an AES-256-GCM key from the submitted flag (PBKDF2-SHA256, same params as
// scripts/generate-challenges.mjs) and try to decrypt `ct`. GCM authentication
// means a wrong flag -> wrong key -> decrypt() rejects, so a successful decrypt
// both proves the flag is correct and hands back the hidden reward.

const PBKDF2_ITERATIONS = 150000

const encoder = new TextEncoder()
const decoder = new TextDecoder()

// Must match the generator: forgiving on case and surrounding whitespace.
export function normalizeFlag(flag) {
  return String(flag).trim().toLowerCase()
}

function fromBase64(b64) {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveKey(flag, salt) {
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(normalizeFlag(flag)), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt'],
  )
}

/**
 * Attempts to unlock a challenge with a candidate flag.
 * @returns {Promise<{ ok: true, reward: string } | { ok: false }>}
 */
export async function tryUnlock(challenge, flag) {
  if (!challenge || !flag) return { ok: false }
  try {
    const key = await deriveKey(flag, fromBase64(challenge.salt))
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: fromBase64(challenge.iv) },
      key,
      fromBase64(challenge.ct),
    )
    return { ok: true, reward: decoder.decode(plaintext) }
  } catch {
    // Wrong flag (auth tag mismatch) or malformed input — treat as incorrect.
    return { ok: false }
  }
}
