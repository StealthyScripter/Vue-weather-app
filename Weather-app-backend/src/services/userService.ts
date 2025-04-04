// src/services/userService.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config';
import logger from '../utils/logger';
import { Secret } from 'jsonwebtoken';


// Simple in-memory user store (replace with a database in production)
const users = [
  {
    id: '1',
    email: 'admin@gmail.com',
    password: '$2b$10$yjHOWZu7Pg7TJmkI9uiDre83hXw3uIpDG.sBFkCZQlK5.bDOQEa52', // 'admin123'
    role: 'admin'
  },
  {
    id: '2',
    email: 'user@gmail.com',
    password: '$2b$10$ljqsJ5kw8ViaD4fY2IlSVeMiHBm92UcJZrZXCvgWtLv0fVrLpq.3K', // 'user123'
    
    role: 'user'
  }
];

export interface User {
  id: string;
  email: string;
  password: string;
  role: string;
}

export interface UserCredentials {
  email: string;
  password: string;
}

export class UserService {
  /**
   * Find a user by email
   * @param email User email
   */
  public findUserByEmail(email: string): User | undefined {
    return users.find(user => user.email === email);
  }
  
  /**
   * Find a user by ID
   * @param id User ID
   */
  public findUserById(id: string): User | undefined {
    return users.find(user => user.id === id);
  }
  
  /**
   * Authenticate a user with email and password
   * @param credentials User credentials
   */
  public async authenticate(credentials: UserCredentials): Promise<string | null> {
    const { email, password } = credentials;
    const user = this.findUserByEmail(email);
    
    if (!user) {
      logger.warn(`Authentication failed: User ${email} not found`);
      return null;
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      logger.warn(`Authentication failed: Invalid password for user ${email}`);
      return null;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      config.jwtSecret as jwt.Secret,
      { expiresIn: config.jwtExpiry as jwt.SignOptions['expiresIn']}
    );
    
    logger.info(`User ${email} authenticated successfully`);
    return token;
  }
  
  /**
   * Generate a password hash
   * @param password Plain text password
   */
  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

export default new UserService();