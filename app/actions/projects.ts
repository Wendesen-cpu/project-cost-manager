'use server';

import { prisma } from '@/app/lib/prisma';
import { Prisma } from '@prisma/client';
import { getSession, SUPER_ADMIN_EMAIL } from '@/app/lib/auth';
import { revalidatePath } from 'next/cache';
import { JWTPayload } from 'jose';

type SessionPayload = JWTPayload & {
    id: string
}


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
    const session = await getSession();
    if (!session || !session.id) {
        throw new Error('Unauthorized');
    }

    console.log('createProject session:', JSON.stringify(session, null, 2));
    console.log('createProject data:', JSON.stringify(data, null, 2));

    const userSession = session as SessionPayload

    const project = await prisma.project.create({
        data: {
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            status: data.status || 'ACTIVE',
            paymentType: data.paymentType || 'FIXED',
            totalPrice: data.totalPrice,
            hourlyRate: data.hourlyRate,
            fixedMonthlyCosts: data.fixedMonthlyCosts || 0,
            fixedTotalCosts: data.fixedTotalCosts || 0,
            owner: {
                connect: {
                    id: userSession.id,
                },
            },
        },
    });
    console.log('Project created successfully with ID:', project.id);
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
    const session = await getSession();
    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) throw new Error('Project not found');
    if (!session || ((project as any).ownerId !== session.id && session.email !== SUPER_ADMIN_EMAIL)) {
        throw new Error('Unauthorized to update this project');
    }

    const updatedProject = await prisma.project.update({
        where: { id },
        data,
    });
    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${id}`);
    return updatedProject;
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

export async function assignEmployeeToProject(
    projectId: string,
    employeeId: string,
    dailyHours: number = 8,
    startDate?: Date,
    endDate?: Date
) {
    const session = await getSession();
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project) throw new Error('Project not found');
    if (!session || ((project as any).ownerId !== session.id && session.email !== SUPER_ADMIN_EMAIL)) {
        throw new Error('Unauthorized to manage team for this project');
    }

    // Check if already assigned
    const existing = await prisma.projectAssignment.findUnique({
        where: {
            employeeId_projectId: {
                employeeId,
                projectId
            }
        }
    });

    const assignmentData = {
        projectId,
        employeeId,
        dailyHours,
        startDate: startDate || new Date(),
        endDate: endDate || null
    };

    if (existing) {
        // If exists, update daily hours and dates
        return await prisma.projectAssignment.update({
            where: { id: existing.id },
            data: { dailyHours, startDate: assignmentData.startDate, endDate: assignmentData.endDate }
        });
    }

    const assignment = await prisma.projectAssignment.create({
        data: assignmentData
    });

    revalidatePath('/admin/projects');
    revalidatePath(`/admin/projects/${projectId}`);
    return assignment;
}
