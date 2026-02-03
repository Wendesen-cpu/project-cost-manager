'use server';

import { prisma } from '@/app/lib/prisma';
import { decryptPassword, verifyPassword, createSession, logout as logoutSession, SUPER_ADMIN_EMAIL } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

export async function loginAdmin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const admin = await prisma.admin.findUnique({ where: { email } });

    // Special logic for Super Admin from Env (Fallback)
    if (!admin && email === SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
        if (password === process.env.SUPER_ADMIN_PASSWORD) {
            // Check if super admin exists but we just didn't find it? 
            // Better to just fail if not found or refer to the ENV.
            // But for now, let's just create it if missing as a fail-safe.
            const newAdmin = await (prisma.admin as any).create({
                data: {
                    email,
                    password: password,
                    role: 'SUPER_ADMIN',
                    status: 'APPROVED',
                    firstName: 'Super',
                    lastName: 'Admin'
                }
            });
            await createSession({ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role });
            redirect('/admin');
        }
    }

    if (!admin) {
        return { error: 'Invalid credentials' };
    }

    let isMatch = false;
    try {
        // Try decryption (new AES system)
        const decrypted = decryptPassword(admin.password);
        isMatch = decrypted === password;
    } catch (e) {
        // Fallback: Try hash verification
        isMatch = await verifyPassword(password, admin.password);
        // Fallback 2: Try direct comparison
        if (!isMatch) {
            isMatch = admin.password === password;
        }
    }

    if (!isMatch) {
        return { error: 'Invalid credentials' };
    }

    if (admin.status !== 'APPROVED') {
        return { error: 'Your account is pending approval.' };
    }

    await createSession({ id: admin.id, email: admin.email, role: admin.role });
    redirect('/admin');
}

export async function logout() {
    await logoutSession();
    redirect('/');
}
