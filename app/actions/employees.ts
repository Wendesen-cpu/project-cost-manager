'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { encryptPassword, decryptPassword, getSession } from '@/app/lib/auth';

export async function createEmployee(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    monthlyCost: number;
    vacationDays: number;
    role?: string;
}) {
    const session = await getSession();
    if (!session || !session.id) {
        return { error: 'Unauthorized' };
    }

    try {
        const encryptedPassword = encryptPassword(data.password);
        const role = data.role || 'EMPLOYEE';

        if (role === 'ADMIN') {
            const admin = await (prisma.admin as any).create({
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    password: encryptedPassword,
                    role: 'ADMIN',
                    status: 'APPROVED',
                    createdById: session.id as string,
                } as any,
            });
            revalidatePath('/admin/employees');
            return { success: true, employee: admin };
        } else {
            const employee = await prisma.employee.create({
                data: {
                    ...data,
                    password: encryptedPassword,
                    role: 'EMPLOYEE',
                    status: 'APPROVED',
                    createdById: session.id as string,
                } as any,
            });
            revalidatePath('/admin/employees');
            return { success: true, employee };
        }
    } catch (error: any) {
        if (error.code === 'P2002') {
            return { error: 'Email already exists' };
        }
        console.error('Error creating user:', error);
        return { error: 'Failed to create user' };
    }
}

export async function getEmployees() {
    const [employees, admins] = await Promise.all([
        prisma.employee.findMany({
            orderBy: { createdAt: 'desc' },
        }),
        prisma.admin.findMany({
            orderBy: { createdAt: 'desc' },
        }),
    ]);

    // Format them to a common shape for the list
    const combined = [
        ...employees.map(e => ({ ...e, isEmployee: true })),
        ...admins.map(a => ({
            ...a,
            isEmployee: false,
            monthlyCost: 0,
            vacationDays: 0,
            approvedById: null
        })),
    ];

    const session = await getSession();
    const currentUserId = session?.id;
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';

    const rolePriority: Record<string, number> = {
        'SUPER_ADMIN': 1,
        'ADMIN': 2,
        'EMPLOYEE': 3,
    };

    return combined.map(user => ({
        ...user,
        isEditable: isSuperAdmin || (user as any).createdById === currentUserId || user.id === currentUserId
    })).sort((a, b) => {
        const priorityA = rolePriority[a.role] || 4;
        const priorityB = rolePriority[b.role] || 4;

        if (priorityA !== priorityB) {
            return priorityA - priorityB;
        }

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}

export async function getEmployee(id: string) {
    const session = await getSession();
    const isSuperAdmin = session?.role === 'SUPER_ADMIN';

    // Try Employee table first
    let user = await prisma.employee.findUnique({
        where: { id },
    }) as any;

    if (!user) {
        // Try Admin table
        user = await prisma.admin.findUnique({
            where: { id },
        });
    }

    if (user && user.password) {
        // Only show password if creator or super admin
        if (isSuperAdmin || (user as any).createdById === session?.id || user.id === session?.id) {
            try {
                user.password = decryptPassword(user.password);
            } catch (e) {
                // Keep as is if decryption fails
            }
        } else {
            user.password = '********'; // Hide for others
        }
    }

    // Add isEditable flag for the backend result as well
    if (user) {
        user.isEditable = isSuperAdmin || (user as any).createdById === session?.id || user.id === session?.id;
    }

    return user;
}

export async function updateEmployee(id: string, data: {
    firstName?: string;
    lastName?: string;
    monthlyCost?: number;
    vacationDays?: number;
    role?: string;
    password?: string;
}) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };

    const updateData: any = { ...data };
    if (data.password) {
        updateData.password = encryptPassword(data.password);
    }

    // Try finding in Employee first
    const employee = await prisma.employee.findUnique({ where: { id } });
    const isSuperAdmin = session.role === 'SUPER_ADMIN';

    let result;
    if (employee) {
        if (!isSuperAdmin && (employee as any).createdById !== session.id && employee.id !== session.id) {
            return { error: 'You do not have permission to edit this user' };
        }
        result = await prisma.employee.update({
            where: { id },
            data: updateData,
        });
    } else {
        const admin = await prisma.admin.findUnique({ where: { id } });
        if (!admin) return { error: 'User not found' };
        if (!isSuperAdmin && (admin as any).createdById !== session.id && admin.id !== session.id) {
            return { error: 'You do not have permission to edit this user' };
        }
        result = await prisma.admin.update({
            where: { id },
            data: updateData,
        });
    }

    revalidatePath('/admin/employees');
    return result;
}

export async function deleteEmployee(id: string) {
    const session = await getSession();
    if (!session) return { error: 'Unauthorized' };
    const isSuperAdmin = session.role === 'SUPER_ADMIN';

    // Try Employee first
    const employee = await prisma.employee.findUnique({ where: { id } });

    if (employee) {
        if (!isSuperAdmin && (employee as any).createdById !== session.id) {
            return { error: 'You do not have permission to delete this user' };
        }
        await prisma.employee.delete({
            where: { id },
        });
    } else {
        const admin = await prisma.admin.findUnique({ where: { id } });
        if (!admin) return { error: 'User not found' };
        if (!isSuperAdmin && (admin as any).createdById !== session.id) {
            return { error: 'You do not have permission to delete this user' };
        }
        await prisma.admin.delete({
            where: { id },
        });
    }
    revalidatePath('/admin/employees');
}
