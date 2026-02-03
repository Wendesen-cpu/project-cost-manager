'use server';

import { prisma } from '@/app/lib/prisma';
import { hashPassword, verifyPassword, createSession, logout as logoutSession, SUPER_ADMIN_EMAIL } from '@/app/lib/auth';
import { sendOtpEmail } from '@/app/lib/email';
import { redirect } from 'next/navigation';

export async function registerAdmin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
        return { error: 'Email and password are required' };
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
        return { error: 'Admin already exists' };
    }

    const hashedPassword = await hashPassword(password);

    // Check if it's the Super Admin registering (first time setup or explicit match)
    // For simplicity, if email matches SUPER_ADMIN_EMAIL, auto-approve and make SUPER_ADMIN
    const role = email === SUPER_ADMIN_EMAIL ? 'SUPER_ADMIN' : 'ADMIN';
    const status = email === SUPER_ADMIN_EMAIL ? 'APPROVED' : 'PENDING';

    await prisma.admin.create({
        data: {
            email,
            password: hashedPassword,
            role,
            status,
        },
    });

    if (status === 'PENDING') {
        return { success: 'Registration successful! Waiting for Super Admin approval.' };
    } else {
        // Auto-login if super admin
        await createSession({ email, role, id: 'super-admin-id' }); // Retrieve actual ID in real app
        redirect('/admin');
    }
}

export async function loginAdmin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const admin = await prisma.admin.findUnique({ where: { email } });

    // Special logic for Super Admin from Env
    if (!admin && email === SUPER_ADMIN_EMAIL && process.env.SUPER_ADMIN_PASSWORD) {
        if (password === process.env.SUPER_ADMIN_PASSWORD) {
            // Auto-create/seed the super admin
            const hashedPassword = await hashPassword(password);
            const newAdmin = await prisma.admin.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'SUPER_ADMIN',
                    status: 'APPROVED',
                }
            });
            await createSession({ id: newAdmin.id, email: newAdmin.email, role: newAdmin.role });
            redirect('/admin');
        }
    }

    if (!admin || !(await verifyPassword(password, admin.password))) {
        return { error: 'Invalid credentials' };
    }

    if (admin.status !== 'APPROVED') {
        return { error: 'Your account is pending approval.' };
    }

    await createSession({ id: admin.id, email: admin.email, role: admin.role });
    redirect('/admin');
}

export async function requestApprovalOtp() {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.otp.create({
        data: {
            email: SUPER_ADMIN_EMAIL,
            code: otpCode,
            expiresAt,
        },
    });

    await sendOtpEmail(SUPER_ADMIN_EMAIL, otpCode);
    return { success: true };
}

export async function approveAdmin(adminId: string, otp: string) {
    // 1. Verify OTP
    const validOtp = await prisma.otp.findFirst({
        where: {
            email: SUPER_ADMIN_EMAIL,
            code: otp,
            expiresAt: { gt: new Date() },
        },
    });

    if (!validOtp) {
        return { error: 'Invalid or expired OTP' };
    }

    // 2. Approve Admin
    await prisma.admin.update({
        where: { id: adminId },
        data: { status: 'APPROVED' },
    });

    // 3. Delete used OTPs (optional cleanup)
    await prisma.otp.deleteMany({ where: { email: SUPER_ADMIN_EMAIL } });

    return { success: true };
}

export async function logout() {
    await logoutSession();
    redirect('/');
}
