/**
 * E2E Encryption Utilities using TweetNaCl (X25519 + XSalsa20-Poly1305)
 * 
 * - Key pairs generated on client side
 * - Public keys shared via server
 * - Messages encrypted/decrypted client-side
 * - Server only sees encrypted blobs (zero-knowledge)
 */
import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64, encodeUTF8, decodeUTF8 } from 'tweetnacl-util';

const STORAGE_KEY = 'chatverse_keypair';

/**
 * Generate or load the user's X25519 key pair.
 * Stored in localStorage so it persists across sessions.
 */
export function getOrCreateKeyPair() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        publicKey: decodeBase64(parsed.publicKey),
        secretKey: decodeBase64(parsed.secretKey),
      };
    } catch {
      // Corrupt data — regenerate
    }
  }

  const keyPair = nacl.box.keyPair();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  }));

  return keyPair;
}

/**
 * Get the public key as a base64 string for sharing with the server.
 */
export function getPublicKeyBase64() {
  const kp = getOrCreateKeyPair();
  return encodeBase64(kp.publicKey);
}

/**
 * Encrypt a message for a specific recipient using their public key.
 * Uses NaCl box (X25519 + XSalsa20-Poly1305).
 * Returns: { nonce, ciphertext } as base64 strings.
 */
export function encryptMessage(plaintext, recipientPublicKeyBase64) {
  const kp = getOrCreateKeyPair();
  const recipientPubKey = decodeBase64(recipientPublicKeyBase64);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = decodeUTF8(plaintext);

  const encrypted = nacl.box(messageBytes, nonce, recipientPubKey, kp.secretKey);
  if (!encrypted) throw new Error('Encryption failed');

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(encrypted),
    senderPublicKey: encodeBase64(kp.publicKey),
  };
}

/**
 * Decrypt a message from a sender using their public key.
 */
export function decryptMessage(ciphertextBase64, nonceBase64, senderPublicKeyBase64) {
  const kp = getOrCreateKeyPair();
  const senderPubKey = decodeBase64(senderPublicKeyBase64);
  const nonce = decodeBase64(nonceBase64);
  const ciphertext = decodeBase64(ciphertextBase64);

  const decrypted = nacl.box.open(ciphertext, nonce, senderPubKey, kp.secretKey);
  if (!decrypted) return null; // Decryption failed (wrong key or tampered)

  return encodeUTF8(decrypted);
}

/**
 * Generate a symmetric shared key for group chats.
 * Uses NaCl secretbox (XSalsa20-Poly1305).
 */
export function generateGroupKey() {
  const key = nacl.randomBytes(nacl.secretbox.keyLength);
  return encodeBase64(key);
}

/**
 * Encrypt with a symmetric group key.
 */
export function encryptWithGroupKey(plaintext, groupKeyBase64) {
  const key = decodeBase64(groupKeyBase64);
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const messageBytes = decodeUTF8(plaintext);

  const encrypted = nacl.secretbox(messageBytes, nonce, key);
  if (!encrypted) throw new Error('Encryption failed');

  return {
    nonce: encodeBase64(nonce),
    ciphertext: encodeBase64(encrypted),
  };
}

/**
 * Decrypt with a symmetric group key.
 */
export function decryptWithGroupKey(ciphertextBase64, nonceBase64, groupKeyBase64) {
  const key = decodeBase64(groupKeyBase64);
  const nonce = decodeBase64(nonceBase64);
  const ciphertext = decodeBase64(ciphertextBase64);

  const decrypted = nacl.secretbox.open(ciphertext, nonce, key);
  if (!decrypted) return null;

  return encodeUTF8(decrypted);
}

/**
 * Generate a BIP39-style recovery phrase from the secret key.
 * (Simplified — uses base64 encoding split into word-sized chunks)
 */
export function generateRecoveryPhrase() {
  const kp = getOrCreateKeyPair();
  const secretB64 = encodeBase64(kp.secretKey);
  // Split into 6-char chunks and return as space-separated "words"
  return secretB64.match(/.{1,6}/g).join(' ');
}

/**
 * Restore key pair from a recovery phrase.
 */
export function restoreFromRecoveryPhrase(phrase) {
  const secretB64 = phrase.split(' ').join('');
  const secretKey = decodeBase64(secretB64);
  const keyPair = nacl.box.keyPair.fromSecretKey(secretKey);

  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    publicKey: encodeBase64(keyPair.publicKey),
    secretKey: encodeBase64(keyPair.secretKey),
  }));

  return keyPair;
}

/**
 * Check if encryption keys exist.
 */
export function hasEncryptionKeys() {
  return !!localStorage.getItem(STORAGE_KEY);
}
