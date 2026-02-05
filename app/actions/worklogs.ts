'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logWork(data: {
    employeeId: string;
    projectId: string;
    date: Date;
    hours: number;
}) {
    const log = await prisma.workLog.create({
        data,
    });
    revalidatePath(`/employee/${data.employeeId}`, 'page');
    revalidatePath(`/employee/${data.employeeId}`, 'layout');
    return log;
}

export async function logVacation(data: {
    employeeId: string;
    date: Date;
}) {
    const vacation = await prisma.vacationLog.create({
        data,
    });

    // Deduct vacation day?
    // Schema says `vacationDays` is "Remaining vacation days".
    // So we should decrement it.
    await prisma.employee.update({
        where: { id: data.employeeId },
        data: {
            vacationDays: {
                decrement: 1
            }
        }
    });

    revalidatePath(`/employee/${data.employeeId}`, 'page');
    revalidatePath(`/employee/${data.employeeId}`, 'layout');
    return vacation;
}

export async function deleteWorkLog(id: string, employeeId: string) {
    await prisma.workLog.delete({
        where: { id }
    });
    revalidatePath(`/employee/${employeeId}`, 'page');
    revalidatePath(`/employee/${employeeId}`, 'layout');
}

export async function updateWorkLog(id: string, employeeId: string, data: { hours?: number, date?: Date }) {
    const updated = await prisma.workLog.update({
        where: { id },
        data
    });
    revalidatePath(`/employee/${employeeId}`, 'page');
    revalidatePath(`/employee/${employeeId}`, 'layout');
    return updated;
}

export async function deleteVacationLog(id: string, employeeId: string) {
    await prisma.vacationLog.delete({
        where: { id }
    });

    // Refund vacation day
    await prisma.employee.update({
        where: { id: employeeId },
        data: {
            vacationDays: {
                increment: 1
            }
        }
    });

    revalidatePath(`/employee/${employeeId}`, 'page');
    revalidatePath(`/employee/${employeeId}`, 'layout');
}

export async function getEmployeeDashboardData(employeeId: string) {
    const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            projects: {
                include: {
                    project: true
                }
            },
            workLogs: {
                take: 10,
                orderBy: { date: 'desc' },
                include: {
                    project: true
                }
            },
            vacations: {
                take: 10,
                orderBy: { date: 'desc' }
            }
        }
    });
    return employee;
}
