import { encrypt, decrypt } from '../lib/crypto';

const plain = 'hello world';
const enc = encrypt(plain);
const dec = decrypt(enc);

console.log('Plain:    ', plain);
console.log('Encrypted:', enc);
console.log('Decrypted:', dec);
console.log('Match:    ', plain === dec);
