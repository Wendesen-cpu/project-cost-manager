'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { encryptPassword, decryptPassword } from '@/app/lib/auth';

export async function createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    monthlyCost: number;
    vacationDays: number;
    role?: string;
}) {
    try {
        const encryptedPassword = encryptPassword(data.password);
        const employee = await prisma.employee.create({
            data: {
                ...data,
                password: encryptedPassword,
                role: data.role || 'EMPLOYEE',
                status: 'APPROVED',
            },
        });
        revalidatePath('/admin/employees');
        return { success: true, employee };
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Email already exists' };
        }
        console.error('Error creating employee:', error);
        return { error: 'Failed to create employee' };
    }
}

export async function getEmployees() {
    return await prisma.employee.findMany({
        orderBy: { createdAt: 'desc' },
    });
}

export async function getEmployee(id: string) {
    const employee = await prisma.employee.findUnique({
        where: { id },
    });
    if (employee && employee.password) {
        try {
            employee.password = decryptPassword(employee.password);
        } catch (e) {
            // Keep as is if decryption fails (e.g. old plain-text password)
        }
    }
    return employee;
}

export async function updateEmployee(id: string, data: {
    firstName?: string;
    lastName?: string;
    monthlyCost?: number;
    vacationDays?: number;
    role?: string;
    password?: string;
}) {
    const updateData: any = { ...data };
    if (data.password) {
        updateData.password = encryptPassword(data.password);
    }

    const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
    });
    revalidatePath('/admin/employees');
    return employee;
}

export async function deleteEmployee(id: string) {
    await prisma.employee.delete({
        where: { id },
    });
    revalidatePath('/admin/employees');
}
