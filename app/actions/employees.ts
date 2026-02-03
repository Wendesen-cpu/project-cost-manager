'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createEmployee(data: {
    firstName: string;
    lastName: string;
    monthlyCost: number;
    vacationDays: number;
    role?: string;
}) {
    const employee = await prisma.employee.create({
        data,
    });
    revalidatePath('/admin/employees');
    return employee;
}

export async function getEmployees() {
    return await prisma.employee.findMany({
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getEmployee(id: string) {
    return await prisma.employee.findUnique({
        where: { id },
    });
}

export async function updateEmployee(id: string, data: {
    firstName?: string;
    lastName?: string;
    monthlyCost?: number;
    vacationDays?: number;
    role?: string;
}) {
    const employee = await prisma.employee.update({
        where: { id },
        data,
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
