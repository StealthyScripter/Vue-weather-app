// src/utils/generateHash.ts
import bcrypt from 'bcrypt';

async function generateHash(user: string) {
    let password;
    if (user === 'admin'){
        password = 'admin123';
    } else if (user === 'user') {
       password = 'user123'; 
    } else {
        return;
    }
  
  const hash = await bcrypt.hash(password, 10);
  console.log(`Password: ${password}, Hash: ${hash}`);
}

generateHash('admin');
generateHash('user');
