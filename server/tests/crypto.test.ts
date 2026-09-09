import { describe, it, expect } from 'vitest';
import { encrypt, decrypt } from '../src/utils/crypto.js';

describe('AES-256-GCM Token Encryption', () => {
  it('should encrypt and decrypt plaintext accurately', () => {
    const sensitiveToken = 'ya29.a0ARrdaM-GoogleOAuthRefreshTokenSecret12345';
    const encrypted = encrypt(sensitiveToken);

    expect(encrypted).not.toBe(sensitiveToken);
    expect(encrypted.split(':')).toHaveLength(3); // iv:authTag:ciphertext

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(sensitiveToken);
  });

  it('should produce different ciphertexts for the same plaintext due to random IV', () => {
    const text = 'secret-refresh-token';
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);

    expect(enc1).not.toBe(enc2);
    expect(decrypt(enc1)).toBe(text);
    expect(decrypt(enc2)).toBe(text);
  });

  it('should fail decryption if ciphertext or auth tag is tampered with', () => {
    const text = 'secure-token';
    const encrypted = encrypt(text);
    const parts = encrypted.split(':');

    // Tamper with the ciphertext
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}aa`;
    expect(() => decrypt(tampered)).toThrow();
  });
});
