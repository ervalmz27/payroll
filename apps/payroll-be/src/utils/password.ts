// src/utils/password.ts
import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function hashPassword(password: string): Promise<string> {
    console.log('[PasswordUtil] Hashing password...');
    return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    console.log('[PasswordUtil] Comparing password...');
    return bcrypt.compare(password, hash);
}