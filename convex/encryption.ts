import nacl from "tweetnacl";

export function encryptSecret(value: string, publicKey: string): string {
  const publicKeyBytes = Buffer.from(publicKey, "base64");
  const valueBytes = Buffer.from(value, "utf-8");
  
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  const ephemeralKeyPair = nacl.box.keyPair();
  
  const encrypted = nacl.box(
    valueBytes,
    nonce,
    publicKeyBytes,
    ephemeralKeyPair.secretKey
  );
  
  const combined = new Uint8Array(nonce.length + encrypted.length);
  combined.set(nonce);
  combined.set(encrypted, nonce.length);
  
  return Buffer.from(combined).toString("base64");
}
