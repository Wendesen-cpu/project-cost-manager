'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function logWork(data: {
    employeeId: string;
    projectId: string;
    date: Date;
    hours: number;
    conflictAction?: 'merge' | 'ignore' | 'add';
}) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    // Check for existing logs on same day and project
    const existingLog = await prisma.workLog.findFirst({
        where: {
            employeeId: data.employeeId,
            projectId: data.projectId,
            date: data.date
        }
    });

    if (existingLog && !data.conflictAction) {
        return {
            conflict: true,
            existingHours: existingLog.hours,
            message: `There is already a log for ${data.hours}h on this project and date. Do you want to merge (total ${existingLog.hours + data.hours}h), ignore, or add a new record?`
        };
    }

    if (existingLog && data.conflictAction === 'merge') {
        const updated = await prisma.workLog.update({
            where: { id: existingLog.id },
            data: { hours: existingLog.hours + data.hours }
        });
        try {
            revalidatePath(`/employee/${data.employeeId}`, 'page');
            revalidatePath(`/employee/${data.employeeId}`, 'layout');
        } catch (e) { }
        return { success: true, log: updated, action: 'merged' };
    }

    if (existingLog && data.conflictAction === 'ignore') {
        return { success: true, log: existingLog, action: 'ignored' };
    }

    // Default or 'add' action
    const log = await prisma.workLog.create({
        data: {
            employeeId: data.employeeId,
            projectId: data.projectId,
            date: data.date,
            hours: data.hours
        }
    });
    try {
        revalidatePath(`/employee/${data.employeeId}`, 'page');
        revalidatePath(`/employee/${data.employeeId}`, 'layout');
    } catch (e) { }
    return { success: true, log, action: 'created' };
}

export async function logVacation(data: {
    employeeId: string;
    date: Date;
    conflictAction?: 'ignore' | 'add';
}) {
    const existingVacation = await prisma.vacationLog.findUnique({
        where: {
            employeeId_date: {
                employeeId: data.employeeId,
                date: data.date
            }
        }
    });

    if (existingVacation && !data.conflictAction) {
        return {
            conflict: true,
            message: `There is already a vacation logged for this date. Do you want to ignore this request?`
        };
    }

    if (existingVacation && data.conflictAction === 'ignore') {
        return { success: true, vacation: existingVacation, action: 'ignored' };
    }

    const vacation = await prisma.vacationLog.create({
        data: {
            employeeId: data.employeeId,
            date: data.date
        }
    });

    await prisma.employee.update({
        where: { id: data.employeeId },
        data: {
            vacationDays: {
                decrement: 1
            }
        }
    });

    try {
        revalidatePath(`/employee/${data.employeeId}`, 'page');
        revalidatePath(`/employee/${data.employeeId}`, 'layout');
    } catch (e) { }
    return { success: true, vacation, action: 'created' };
}

export async function deleteWorkLog(id: string, employeeId: string) {
    await prisma.workLog.delete({
        where: { id }
    });
    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) { }
}

export async function updateWorkLog(id: string, employeeId: string, data: { hours?: number, date?: Date }) {
    if (data.hours !== undefined && (data.hours <= 0 || data.hours % 0.5 !== 0)) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }
    const updated = await prisma.workLog.update({
        where: { id },
        data
    });
    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) {
        // Ignore errors outside of Next.js context
    }
    return updated;
}

export async function addBulkWorkLogs(data: {
    employeeId: string;
    projectId: string;
    startDate: Date;
    endDate: Date;
    hours: number;
    skipWeekends: boolean;
}) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    const logsToCreate = [];
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getUTCDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (data.skipWeekends && isWeekend) continue;

        logsToCreate.push({
            employeeId: data.employeeId,
            projectId: data.projectId,
            date: new Date(d),
            hours: data.hours,
        });
    }

    if (logsToCreate.length === 0) return { count: 0 };

    const result = await prisma.workLog.createMany({
        data: logsToCreate,
    });

    try {
        revalidatePath(`/employee/${data.employeeId}`, 'page');
        revalidatePath(`/employee/${data.employeeId}`, 'layout');
    } catch (e) { }
    return result;
}

export async function updateBulkWorkLogs(employeeId: string, data: {
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    hours: number;
}) {
    if (data.hours <= 0 || data.hours % 0.5 !== 0) {
        throw new Error('Hours must be a positive multiple of 0.5');
    }

    const whereClause: any = { employeeId };
    if (data.projectId) whereClause.projectId = data.projectId;
    if (data.startDate && data.endDate) {
        whereClause.date = {
            gte: data.startDate,
            lte: data.endDate
        };
    }

    const updated = await prisma.workLog.updateMany({
        where: whereClause,
        data: { hours: data.hours }
    });

    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) {
        // Ignore errors outside of Next.js context
    }
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

    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) { }
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
                take: 100,
                orderBy: { date: 'desc' },
                include: {
                    project: true
                }
            },
            vacations: {
                take: 100,
                orderBy: { date: 'desc' }
            }
        }
    });
    return employee;
}

export async function clearAllLogs(employeeId: string) {
    const vacationsCount = await prisma.vacationLog.count({
        where: { employeeId }
    });

    await prisma.$transaction([
        prisma.workLog.deleteMany({
            where: { employeeId }
        }),
        prisma.vacationLog.deleteMany({
            where: { employeeId }
        }),
        prisma.employee.update({
            where: { id: employeeId },
            data: {
                vacationDays: {
                    increment: vacationsCount
                }
            }
        })
    ]);

    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) { }
}

export async function deleteDuplicateWorkLogs(employeeId: string, startDate?: Date, endDate?: Date) {
    const where: any = { employeeId };
    if (startDate && endDate) {
        where.date = { gte: startDate, lte: endDate };
    }

    const logs = await prisma.workLog.findMany({
        where,
        orderBy: { createdAt: 'asc' }
    });

    const seen = new Set<string>();
    const toDelete: string[] = [];

    for (const log of logs) {
        const key = `${log.projectId}-${log.date.toISOString()}`;
        if (seen.has(key)) {
            toDelete.push(log.id);
        } else {
            seen.add(key);
        }
    }

    if (toDelete.length > 0) {
        await prisma.workLog.deleteMany({
            where: { id: { in: toDelete } }
        });
    }

    try {
        revalidatePath(`/employee/${employeeId}`, 'page');
        revalidatePath(`/employee/${employeeId}`, 'layout');
    } catch (e) { }
    return { deletedCount: toDelete.length };
}

export async function deleteDuplicateVacations(employeeId: string, startDate?: Date, endDate?: Date) {
    // VacationLog has unique constraint on [employeeId, date], so duplicates aren't possible 
    // unless the database schema was different or we want to handle multiple vacations for different reasons (not in this schema).
    // However, for consistency with the user request:
    return { deletedCount: 0 };
}
