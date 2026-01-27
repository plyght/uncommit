import sodium from "libsodium-wrappers";

export async function encryptSecret(value: string, publicKey: string): Promise<string> {
  await sodium.ready;
  
  const publicKeyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const valueBytes = sodium.from_string(value);
  
  const encrypted = sodium.crypto_box_seal(valueBytes, publicKeyBytes);
  
  return sodium.to_base64(encrypted, sodium.base64_variants.ORIGINAL);
}
