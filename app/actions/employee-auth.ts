'use server';

import { prisma } from '@/app/lib/prisma';
import { getSession } from '@/app/lib/auth';
import { redirect } from 'next/navigation';

import { hashPassword, verifyPassword, decryptPassword, createEmployeeSession } from '@/app/lib/auth';

export async function registerEmployee(formData: FormData) {
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!firstName || !lastName || !email || !password) {
        return { error: 'All fields are required' };
    }

    const existingEmployee = await prisma.employee.findUnique({ where: { email } });
    if (existingEmployee) {
        return { error: 'Email already registered' };
    }

    const hashedPassword = await hashPassword(password);

    await prisma.employee.create({
        data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            monthlyCost: 0,
            status: 'PENDING',
        },
    });

    return { success: 'Registration successful! Waiting for Admin approval.' };
}

export async function loginEmployee(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const employee = await prisma.employee.findUnique({ where: { email } });

    if (!employee) {
        return { error: 'Invalid credentials' };
    }

    let isMatch = false;
    try {
        // Try decryption (new AES system)
        const decrypted = decryptPassword(employee.password);
        isMatch = decrypted === password;
    } catch (e) {
        // Fallback: Try hash verification (briefly used system)
        isMatch = await verifyPassword(password, employee.password);
        // Fallback 2: Try direct comparison (old plain-text system)
        if (!isMatch) {
            isMatch = employee.password === password;
        }
    }

    if (!isMatch) {
        return { error: 'Invalid credentials' };
    }

    if (employee.status !== 'APPROVED') {
        return { error: 'Your account is pending approval.' };
    }

    await createEmployeeSession({ id: employee.id, email: employee.email, role: 'EMPLOYEE' });
    redirect(`/employee/${employee.id}`);
}

export async function approveEmployee(employeeId: string) {
    const session = await getSession();
    if (!session || !session.id) {
        return { error: 'Unauthorized' };
    }

    // Update status and track who approved
    await prisma.employee.update({
        where: { id: employeeId },
        data: {
            status: 'APPROVED',
            approvedById: session.id,
        },
    });

    return { success: true };
}
