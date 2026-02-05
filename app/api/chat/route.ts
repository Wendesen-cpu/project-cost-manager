import { groq } from '@ai-sdk/groq';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { logWork, logVacation, deleteWorkLog, updateWorkLog } from '@/app/actions/worklogs';
import { getEmployeeSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const session = await getEmployeeSession();

    if (!session || typeof session.id !== 'string') {
        return new Response('Unauthorized', { status: 401 });
    }

    const employeeId = session.id;

    // Convert UI messages to Model messages
    const modelMessages = await convertToModelMessages(messages);

    // Fetch projects for tool context
    const employeeWithProjects = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            projects: {
                include: { project: true }
            }
        }
    });

    const availableProjects = employeeWithProjects?.projects.map((p: any) => ({
        id: p.project.id as string,
        name: p.project.name as string
    })) || [];

    const result = streamText({
        model: groq('llama-3.3-70b-versatile'),
        messages: modelMessages,
        stopWhen: stepCountIs(5),
        system: `You are a helpful assistant for employees. 
    You can help them log work hours, update existing logs, or delete logs.
    
    Current Date: ${new Date().toISOString().split('T')[0]}
    
    Assigned Projects:
    ${availableProjects.map((p: any) => `- ${p.name} (ID: ${p.id})`).join('\n')}
    
    Rules:
    - If the user wants to log hours, identify the project name.
    - If the user wants to update or delete a log, use getRecentWorkLogs first if you don't know the exact log ID.
    - If the user says "today", use ${new Date().toISOString().split('T')[0]}.
    - If the user says "yesterday", calculate the date correctly.
    - Be concise and professional.`,
        tools: {
            getRecentWorkLogs: {
                description: 'Get the last 10 work logs for the current employee',
                inputSchema: z.object({}),
                execute: async () => {
                    const logs = await prisma.workLog.findMany({
                        where: { employeeId },
                        orderBy: { date: 'desc' },
                        take: 10,
                        include: { project: true }
                    });
                    return {
                        success: true,
                        logs: logs.map(l => ({
                            id: l.id,
                            project: l.project.name,
                            date: l.date.toISOString().split('T')[0],
                            hours: l.hours
                        }))
                    };
                }
            },
            logWork: {
                description: 'Log work hours for a specific project',
                inputSchema: z.object({
                    projectId: z.string().describe('The ID of the project'),
                    date: z.string().describe('The date of the work log in YYYY-MM-DD format'),
                    hours: z.number().describe('The number of hours worked')
                }),
                execute: async ({ projectId, date, hours }: { projectId: string, date: string, hours: number }) => {
                    const log = await logWork({
                        employeeId,
                        projectId,
                        date: new Date(date),
                        hours
                    });
                    const projectName = availableProjects.find((p: any) => p.id === projectId)?.name;
                    return { success: true, message: `Logged ${hours} hours for ${projectName} on ${date}`, logId: log.id };
                }
            },
            updateWorkLog: {
                description: 'Update an existing work log',
                inputSchema: z.object({
                    logId: z.string().describe('The ID of the work log to update'),
                    hours: z.number().optional().describe('The new number of hours'),
                    date: z.string().optional().describe('The new date in YYYY-MM-DD format')
                }),
                execute: async ({ logId, hours, date }: { logId: string, hours?: number, date?: string }) => {
                    await updateWorkLog(logId, employeeId, {
                        hours,
                        date: date ? new Date(date) : undefined
                    });
                    return { success: true, message: `Updated work log ${logId}` };
                }
            },
            deleteWorkLog: {
                description: 'Delete a work log',
                inputSchema: z.object({
                    logId: z.string().describe('The ID of the work log to delete')
                }),
                execute: async ({ logId }: { logId: string }) => {
                    await deleteWorkLog(logId, employeeId);
                    return { success: true, message: `Deleted work log ${logId}` };
                }
            },
            logVacation: {
                description: 'Log a vacation day',
                inputSchema: z.object({
                    date: z.string().describe('The date of the vacation in YYYY-MM-DD format')
                }),
                execute: async ({ date }: { date: string }) => {
                    await logVacation({
                        employeeId,
                        date: new Date(date)
                    });
                    return { success: true, message: `Logged vacation for ${date}` };
                }
            }
        }
    });

    return result.toUIMessageStreamResponse();
}
