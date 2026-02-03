'use server';

import { prisma } from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createProject(data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    status?: string;
    paymentType?: string;
    totalPrice?: number;
    hourlyRate?: number;
    fixedMonthlyCosts?: number;
    fixedTotalCosts?: number;
}) {
    const project = await prisma.project.create({
        data,
    });
    revalidatePath('/admin/projects');
    return project;
}

export async function updateProject(id: string, data: {
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    status?: string;
    paymentType?: string;
    totalPrice?: number;
    hourlyRate?: number;
    fixedMonthlyCosts?: number;
    fixedTotalCosts?: number;
}) {
    const project = await prisma.project.update({
        where: { id },
        data,
    });
    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${id}`);
    return project;
}

export async function getProjects() {
    return await prisma.project.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            members: {
                include: {
                    employee: true
                }
            }
        }
    });
}

export async function assignEmployeeToProject(projectId: string, employeeId: string) {
    // Check if already assigned
    const existing = await prisma.projectAssignment.findUnique({
        where: {
            employeeId_projectId: {
                employeeId,
                projectId
            }
        }
    });

    if (existing) return existing;

    const assignment = await prisma.projectAssignment.create({
        data: {
            projectId,
            employeeId
        }
    });
    revalidatePath('/admin/projects');
    return assignment;
}
