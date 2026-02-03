import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import crypto from 'crypto';

const SECRET_KEY = process.env.SESSION_SECRET || 'super-secret-key-change-this';
const key = new TextEncoder().encode(SECRET_KEY);

// For Symmetric Encryption (AES-256-GCM)
const ENCRYPTION_KEY = crypto.scryptSync(SECRET_KEY, 'salt', 32);
const IV_LENGTH = 12;

export const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@company.com';

export function encryptPassword(text: string) {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptPassword(text: string) {
    const data = Buffer.from(text, 'base64');
    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = data.subarray(IV_LENGTH + 16);
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final('utf8');
}

export async function hashPassword(password: string) {
    return await hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
    return await compare(password, hash);
}

export async function createSession(payload: any) {
    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('admin_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function createEmployeeSession(payload: any) {
    const session = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(key);

    const cookieStore = await cookies();
    cookieStore.set('employee_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
    });
}

export async function getSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function getEmployeeSession() {
    const cookieStore = await cookies();
    const session = cookieStore.get('employee_session')?.value;
    if (!session) return null;

    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        });
        return payload;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
}

export async function logoutEmployee() {
    const cookieStore = await cookies();
    cookieStore.delete('employee_session');
}
