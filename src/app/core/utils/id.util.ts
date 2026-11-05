const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I


export function newId(prefix: string): string {
  const bytes = new Uint8Array(4);
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return `${prefix}-${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
}

/** 8-character reservation code, similar in shape to the wireframe's `HMNK55PBZK`. */
export function newConfirmationCode(existing: ReadonlySet<string>): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const bytes = new Uint8Array(8);
    if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
      crypto.getRandomValues(bytes);
    } else {
      for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    const code = Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    if (!existing.has(code)) return code;
  }
  throw new Error('Could not generate a unique confirmation code');
}
