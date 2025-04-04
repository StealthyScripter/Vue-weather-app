// src/utils/generateHash.ts
import bcrypt from 'bcrypt';

async function generateHash() {
  const password = 'user123';
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}, Hash: ${hash}`);
}

generateHash();