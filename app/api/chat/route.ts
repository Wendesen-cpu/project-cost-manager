import { groq } from '@ai-sdk/groq';
import { streamText, stepCountIs } from 'ai';
import { z } from 'zod';
import { logWork, logVacation, deleteWorkLog, updateWorkLog, updateBulkWorkLogs, addBulkWorkLogs, clearAllLogs, deleteDuplicateWorkLogs } from '@/app/actions/worklogs';
import { getEmployeeSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';
import { createOllama } from 'ai-sdk-ollama';


const ollama = createOllama({
    baseURL: 'http://localhost:11434',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const session = await getEmployeeSession();

    if (!session || typeof session.id !== 'string') {
        return new Response('Unauthorized', { status: 401 });
    }

    const employeeId = session.id;

    const modelMessages = messages.map((m: any) => {
        let textContent = '';
        if (typeof m.content === 'string') {
            textContent = m.content;
        } else if (Array.isArray(m.parts)) {
            textContent = m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n');
        } else if (Array.isArray(m.content)) {
            textContent = m.content
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n');
        } else if (m.parts && typeof m.parts === 'object') {
            textContent = (m.parts as any).text || '';
        }

        return {
            role: (m.role === 'user' || m.role === 'system') ? 'user' : 'assistant',
            content: (textContent || ' ').trim()
        };
    }).filter((m: any) => m.content !== '');

    // Fetch projects for tool context
    const employeeWithProjects = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
            projects: {
                include: { project: true }
            }
        }
    });

    const availableProjects = (employeeWithProjects?.projects || []).map((p) => ({
        id: p.project.id,
        name: p.project.name
    }));

    const availableProjectMap = Object.fromEntries(
        (employeeWithProjects?.projects || []).map((p) => [p.project.name.toLowerCase(), p.project.id])
    );

    try {
        const result = streamText({
            // model: groq('llama-3.3-70b-versatile'),
            model: groq('openai/gpt-oss-120b'),
            // model: ollama('qwen3-coder:480b-cloud'),
            messages: modelMessages,
            stopWhen: stepCountIs(15),
            system: `You are the Project Pro Assistant.

### YOUR IDENTITY:
- Name: Project Pro Assistant.
- Purpose: Help users log work hours, view recent activity, update logs, or record vacations.
- Greeting: When the user says "Hi", introduce yourself briefly.

### ⚠️ CRITICAL RULE #1 - PROJECT SELECTION ⚠️:
**WHEN USER WANTS TO LOG WORK BUT DOES NOT SPECIFY A PROJECT:**

YOU MUST CALL THE requestProjectSelection TOOL. DO NOT RESPOND WITH TEXT OR JSON.

❌ NEVER DO THIS:
- "Which project would you like to use?"
- ANY text response asking about projects.
- Outputting JSON like {"action": "..."} or {"status": "..."}.

✅ ALWAYS DO THIS INSTEAD:
- IMMEDIATELY call requestProjectSelection tool.
- DO NOT say anything, just call the tool.

### ⚠️ CRITICAL RULE #2 - NO RAW JSON ⚠️:
- NEVER output raw JSON in your response. 
- If you need to perform an action, use a tool.
- If you need to speak to the user, use plain text.
- Any output starting with '{' and ending with '}' that is not a tool call is a failure.

### OTHER RULES:
1. DATE FORMAT: Always use YYYY-MM-DD (ISO) for tools. "today" is ${new Date().toISOString().split('T')[0]} (${new Date().toLocaleDateString('en-US', { weekday: 'long' })}).

3. RANGES: For ranges (e.g. Feb 5-10), use addBulkWorkLogs tool.

4. WEEKENDS: For bulk requests (e.g. "all month"), DEFAULT to skipping weekends unless user says "include weekends". For single dates on weekends, ask for confirmation.

5. CONFIRMATIONS: When a tool says "CONFIRMATION REQUIRED" and user says "yes":
   - DO NOT ask the user again
   - IMMEDIATELY call the SAME tool with ALL the same parameters
   - ADD confirmed: true to the parameters

### DUPLICATE PREVENTION:
1. When logging work or vacation:
   - If the tool returns 'conflict: true', DO NOT assume the user wants to overwrite.
   - TELL the user there is an existing log and ask: "Should I remind you that there is already a log for X hours? Would you like to merge them (total Y hours), ignore this request, or add it as a new separate entry?"
   - For vacations, ask: "There is already a vacation logged. Should I ignore this request or add it anyway?"
   - When the user confirms, call the tool again with the appropriate 'conflictAction' ('merge', 'ignore', or 'add').

### PROJECTS LIST:
${availableProjects.map((p: any) => `- ${p.name} (ID: ${p.id})`).join('\n')}
`,
            tools: {
                getRecentWorkLogs: {
                    description: 'Get recent work logs for the current employee',
                    inputSchema: z.object({}),
                    execute: async () => {
                        const logs = await prisma.workLog.findMany({
                            where: { employeeId },
                            orderBy: { date: 'desc' },
                            take: 50,
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
                requestProjectSelection: {
                    description: 'Call this when user wants to log work but did not specify which project. Returns available projects for user to select from.',
                    inputSchema: z.object({
                        actionType: z.enum(['logWork', 'addBulkWorkLogs']).describe('The type of action pending'),
                        hours: z.number().optional().describe('Hours for single day log'),
                        date: z.string().optional().describe('Date for single day log (YYYY-MM-DD)'),
                        startDate: z.string().optional().describe('Start date for bulk log'),
                        endDate: z.string().optional().describe('End date for bulk log'),
                        hoursPerDay: z.number().optional().describe('Hours per day for bulk log'),
                        skipWeekends: z.boolean().optional().describe('If true, weekends are skipped for bulk logs'),
                        month: z.string().optional().describe('Month in YYYY-MM format (e.g., 2026-02)')
                    }),
                    execute: async ({ actionType, hours, date, startDate, endDate, hoursPerDay, skipWeekends, month }: {
                        actionType: 'logWork' | 'addBulkWorkLogs',
                        hours?: number,
                        date?: string,
                        startDate?: string,
                        endDate?: string,
                        hoursPerDay?: number,
                        skipWeekends?: boolean,
                        month?: string
                    }) => {
                        return {
                            success: true,
                            requiresProjectSelection: true,
                            projects: availableProjects,
                            pendingAction: {
                                type: actionType,
                                hours,
                                date,
                                startDate,
                                endDate,
                                hoursPerDay,
                                skipWeekends,
                                month
                            },
                            message: 'Please select a project from the list above.'
                        };
                    }
                },
                selectProjectAndLog: {
                    description: 'Execute a pending work log action after user selects a project',
                    inputSchema: z.object({
                        projectId: z.string().describe('The selected project ID'),
                        actionType: z.enum(['logWork', 'addBulkWorkLogs']),
                        hours: z.number().optional(),
                        date: z.string().optional(),
                        startDate: z.string().optional(),
                        endDate: z.string().optional(),
                        hoursPerDay: z.number().optional(),
                        confirmed: z.boolean().optional(),
                        skipWeekends: z.boolean().optional(),
                        month: z.string().optional()
                    }),
                    execute: async ({ projectId, actionType, hours, date, startDate, endDate, hoursPerDay, confirmed, skipWeekends, month }: {
                        projectId: string,
                        actionType: 'logWork' | 'addBulkWorkLogs',
                        hours?: number,
                        date?: string,
                        startDate?: string,
                        endDate?: string,
                        hoursPerDay?: number,
                        confirmed?: boolean,
                        skipWeekends?: boolean,
                        month?: string
                    }) => {
                        try {
                            if (actionType === 'logWork' && date && hours !== undefined) {
                                const d = new Date(date);
                                const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                                if (isWeekend && !confirmed) {
                                    return {
                                        success: false,
                                        message: `${date} is a weekend. Ask user for confirmation.`,
                                        requiresConfirmation: true
                                    };
                                }

                                let targetId = projectId;
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetId = availableProjectMap[lowerInput];
                                }

                                await logWork({
                                    employeeId,
                                    projectId: targetId,
                                    date: d,
                                    hours
                                });
                                const projectName = availableProjects.find((p: any) => p.id === targetId)?.name || 'the project';
                                return { success: true, message: `Logged ${hours}h for ${projectName} on ${date}.` };
                            } else if (actionType === 'addBulkWorkLogs' && hoursPerDay !== undefined && (month || (startDate && endDate))) {
                                let start: Date;
                                let end: Date;
                                let dateRangeStr = '';

                                if (month) {
                                    const [year, monthNum] = month.split('-').map(Number);
                                    start = new Date(Date.UTC(year, monthNum - 1, 1));
                                    end = new Date(Date.UTC(year, monthNum, 0));
                                    dateRangeStr = `${month} (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`;
                                } else if (startDate && endDate) {
                                    start = new Date(startDate);
                                    end = new Date(endDate);
                                    dateRangeStr = `${startDate} to ${endDate}`;
                                } else {
                                    return { success: false, message: 'Invalid arguments. Provide month or start/end dates.' };
                                }

                                if (skipWeekends === false) {
                                    const weekendDates = [];
                                    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                        const dayOfWeek = d.getUTCDay();
                                        if (dayOfWeek === 0 || dayOfWeek === 6) {
                                            weekendDates.push(d.toISOString().split('T')[0]);
                                        }
                                    }

                                    if (weekendDates.length > 0 && !confirmed) {
                                        return {
                                            success: false,
                                            message: `The range includes weekend days: ${weekendDates.join(', ')}. Ask user for confirmation.`,
                                            requiresConfirmation: true
                                        };
                                    }
                                }

                                let targetId = projectId;
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetId = availableProjectMap[lowerInput];
                                }

                                const result = await addBulkWorkLogs({
                                    employeeId,
                                    projectId: targetId,
                                    startDate: start,
                                    endDate: end,
                                    hours: hoursPerDay,
                                    skipWeekends: skipWeekends !== false // Default to true
                                });

                                const projectName = availableProjects.find((p: any) => p.id === targetId)?.name || 'the project';
                                return {
                                    success: true,
                                    message: `Logged ${hoursPerDay}h for ${projectName} on ${result.count} days (${dateRangeStr}).`
                                };
                            }
                            return { success: false, message: 'Invalid action parameters.' };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                logWork: {
                    description: 'Log work hours for a specific project. IMPORTANT: Only call this if the user explicitly mentioned a project name. If they did not, use requestProjectSelection instead.',
                    inputSchema: z.object({
                        projectId: z.string().describe('The ID or Name of the project'),
                        date: z.string().describe('The date in YYYY-MM-DD format'),
                        hours: z.coerce.number().describe('Hours worked'),
                        confirmed: z.boolean().optional().describe('True if user confirmed weekend logging'),
                        conflictAction: z.enum(['merge', 'ignore', 'add']).optional().describe('Action to take if a log already exists for this date and project')
                    }),
                    execute: async ({ projectId, date, hours, confirmed, conflictAction }: { projectId: string, date: string, hours: number, confirmed?: boolean, conflictAction?: 'merge' | 'ignore' | 'add' }) => {
                        try {
                            const d = new Date(date);
                            const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                            if (isWeekend && !confirmed) {
                                return {
                                    success: false,
                                    message: `${date} is a weekend. Ask user for confirmation.`,
                                    requiresConfirmation: true
                                };
                            }

                            let targetId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetId = availableProjectMap[lowerInput];
                            }

                            const result = await logWork({
                                employeeId,
                                projectId: targetId,
                                date: d,
                                hours,
                                conflictAction
                            });

                            if ((result as any).conflict) {
                                return {
                                    success: false,
                                    conflict: true,
                                    message: (result as any).message,
                                    existingHours: (result as any).existingHours
                                };
                            }

                            const projectName = availableProjects.find((p: any) => p.id === targetId)?.name || 'the project';
                            let msg = `Logged ${hours}h for ${projectName} on ${date}.`;
                            if ((result as any).action === 'merged') msg = `Merged ${hours}h into existing log for ${projectName} on ${date}.`;
                            if ((result as any).action === 'ignored') msg = `Ignored request as log already exists for ${projectName} on ${date}.`;

                            return { success: true, message: msg };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                addBulkWorkLogs: {
                    description: 'Log work hours for multiple consecutive days. Use this when the user wants to log the same hours across a date range.',
                    inputSchema: z.object({
                        projectId: z.string().describe('The ID or Name of the project'),
                        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
                        endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
                        month: z.string().optional().describe('Month in YYYY-MM format (e.g., 2026-02)'),
                        hoursPerDay: z.coerce.number().describe('Hours to log per day'),
                        skipWeekends: z.boolean().optional().describe('If true, Saturday and Sunday will be skipped automatically'),
                        confirmed: z.boolean().optional().describe('True if user confirmed weekend logging')
                    }),
                    execute: async ({ projectId, startDate, endDate, month, hoursPerDay, skipWeekends, confirmed }: {
                        projectId: string,
                        startDate?: string,
                        endDate?: string,
                        month?: string,
                        hoursPerDay: number,
                        skipWeekends?: boolean,
                        confirmed?: boolean
                    }) => {
                        try {
                            let start: Date;
                            let end: Date;
                            let dateRangeStr = '';

                            if (month) {
                                const [year, monthNum] = month.split('-').map(Number);
                                start = new Date(Date.UTC(year, monthNum - 1, 1));
                                end = new Date(Date.UTC(year, monthNum, 0));
                                dateRangeStr = `${month} (${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]})`;
                            } else if (startDate && endDate) {
                                start = new Date(startDate);
                                end = new Date(endDate);
                                dateRangeStr = `${startDate} to ${endDate}`;
                            } else {
                                return { success: false, message: 'Please provide either a month OR a start/end date range.' };
                            }

                            const weekendDates = [];

                            if (skipWeekends === false) {
                                // Check for weekends first if not skipping
                                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                                    const dayOfWeek = d.getUTCDay();
                                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                                        weekendDates.push(d.toISOString().split('T')[0]);
                                    }
                                }

                                if (weekendDates.length > 0 && !confirmed) {
                                    return {
                                        success: false,
                                        message: `The range includes weekend days: ${weekendDates.join(', ')}. Ask user for confirmation.`,
                                        requiresConfirmation: true
                                    };
                                }
                            }

                            // Resolve project ID
                            let targetId = projectId;
                            const lowerInput = projectId.toLowerCase();
                            if (availableProjectMap[lowerInput]) {
                                targetId = availableProjectMap[lowerInput];
                            }

                            const result = await addBulkWorkLogs({
                                employeeId,
                                projectId: targetId,
                                startDate: start,
                                endDate: end,
                                hours: hoursPerDay,
                                skipWeekends: skipWeekends !== false // Default to true
                            });

                            const projectName = availableProjects.find((p: any) => p.id === targetId)?.name || 'the project';
                            return {
                                success: true,
                                message: `Logged ${hoursPerDay}h for ${projectName} on ${result.count} days (${dateRangeStr}).`
                            };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                updateWorkLog: {
                    description: 'Update an existing work log. If logId is not known, provide date and projectId.',
                    inputSchema: z.object({
                        logId: z.string().optional().describe('The ID of the work log to update'),
                        hours: z.coerce.number().optional().describe('The new number of hours'),
                        date: z.string().optional().describe('The date in YYYY-MM-DD format (if logId is missing)'),
                        projectId: z.string().optional().describe('The ID or Name of the project (if logId is missing)')
                    }),
                    execute: async ({ logId, hours, date, projectId }: { logId?: string, hours?: number, date?: string, projectId?: string }) => {
                        try {
                            let targetLogId = logId;

                            if (!targetLogId && date && projectId) {
                                let targetProjectId = projectId;
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetProjectId = availableProjectMap[lowerInput];
                                }

                                const workLog = await prisma.workLog.findFirst({
                                    where: {
                                        employeeId,
                                        projectId: targetProjectId,
                                        date: new Date(date)
                                    }
                                });

                                if (!workLog) {
                                    return { success: false, message: `No work log found for ${date} on that project.` };
                                }
                                targetLogId = workLog.id;
                            }

                            if (!targetLogId) {
                                return { success: false, message: 'Please provide either a log ID or both date and project.' };
                            }

                            await updateWorkLog(targetLogId, employeeId, {
                                hours,
                                date: date ? new Date(date) : undefined
                            });
                            return { success: true, message: `Updated work log successfully.` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                updateBulkWorkLogs: {
                    description: 'Update work hours for multiple days or a project. Requires either a date range or a project.',
                    inputSchema: z.object({
                        projectId: z.string().optional().describe('The ID or Name of the project'),
                        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
                        endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
                        hours: z.coerce.number().describe('The new number of hours per day')
                    }),
                    execute: async ({ projectId, startDate, endDate, hours }: {
                        projectId?: string,
                        startDate?: string,
                        endDate?: string,
                        hours: number
                    }) => {
                        try {
                            let targetProjectId = projectId;
                            if (projectId) {
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetProjectId = availableProjectMap[lowerInput];
                                }
                            }

                            await updateBulkWorkLogs(employeeId, {
                                projectId: targetProjectId,
                                startDate: startDate ? new Date(startDate) : undefined,
                                endDate: endDate ? new Date(endDate) : undefined,
                                hours
                            });

                            let msg = `Updated hours to ${hours}h`;
                            if (startDate && endDate) msg += ` from ${startDate} to ${endDate}`;
                            if (projectId) {
                                const projectName = availableProjects.find((p: any) => p.id === targetProjectId)?.name || projectId;
                                msg += ` for project ${projectName}`;
                            }

                            return { success: true, message: msg };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                deleteWorkLog: {
                    description: 'Delete a work log by ID, or by date and project',
                    inputSchema: z.object({
                        logId: z.string().optional().describe('The ID of the work log to delete'),
                        date: z.string().optional().describe('The date in YYYY-MM-DD format'),
                        projectId: z.string().optional().describe('The ID or Name of the project')
                    }),
                    execute: async ({ logId, date, projectId }: { logId?: string, date?: string, projectId?: string }) => {
                        try {
                            let targetLogId = logId;

                            // If no logId provided, look up by date and project
                            if (!targetLogId && date && projectId) {
                                // Match project name to ID
                                let targetProjectId = projectId;
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetProjectId = availableProjectMap[lowerInput];
                                }

                                // Find the work log
                                const workLog = await prisma.workLog.findFirst({
                                    where: {
                                        employeeId,
                                        projectId: targetProjectId,
                                        date: new Date(date)
                                    }
                                });

                                if (!workLog) {
                                    return { success: false, message: `No work log found for ${date} on that project.` };
                                }

                                targetLogId = workLog.id;
                            }

                            if (!targetLogId) {
                                return { success: false, message: 'Please provide either a log ID or both date and project.' };
                            }

                            await deleteWorkLog(targetLogId, employeeId);
                            return { success: true, message: `Deleted work log successfully.` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                logVacation: {
                    description: 'Log vacation for a specific day',
                    inputSchema: z.object({
                        date: z.string().describe('The date in YYYY-MM-DD format'),
                        confirmed: z.boolean().optional().describe('True if logging on a weekend'),
                        conflictAction: z.enum(['ignore', 'add']).optional().describe('Action to take if vacation already exists')
                    }),
                    execute: async ({ date, confirmed, conflictAction }: { date: string, confirmed?: boolean, conflictAction?: 'ignore' | 'add' }) => {
                        try {
                            const d = new Date(date);
                            const isWeekend = d.getUTCDay() === 0 || d.getUTCDay() === 6;

                            if (isWeekend && !confirmed) {
                                return {
                                    success: false,
                                    message: `${date} is a weekend. Ask user for confirmation.`,
                                    requiresConfirmation: true
                                };
                            }

                            const result = await logVacation({
                                employeeId,
                                date: d,
                                conflictAction
                            });

                            if ((result as any).conflict) {
                                return {
                                    success: false,
                                    conflict: true,
                                    message: (result as any).message
                                };
                            }

                            return { success: true, message: `Logged vacation for ${date}.` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                deleteVacation: {
                    description: 'Delete a vacation log by date',
                    inputSchema: z.object({
                        date: z.string().describe('The date in YYYY-MM-DD format')
                    }),
                    execute: async ({ date }: { date: string }) => {
                        try {
                            const vacationLog = await prisma.vacationLog.findFirst({
                                where: {
                                    employeeId,
                                    date: new Date(date)
                                }
                            });

                            if (!vacationLog) {
                                return { success: false, message: `No vacation found for ${date}.` };
                            }

                            await prisma.vacationLog.delete({
                                where: { id: vacationLog.id }
                            });

                            // Refund vacation day
                            await prisma.employee.update({
                                where: { id: employeeId },
                                data: { vacationDays: { increment: 1 } }
                            });

                            return { success: true, message: `Deleted vacation for ${date}.` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                deleteBulkWorkLogs: {
                    description: 'Delete multiple work logs by date range, month, or month range. Requires confirmation.',
                    inputSchema: z.object({
                        projectId: z.string().optional().describe('The ID or Name of the project (optional, if not provided deletes for all projects)'),
                        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
                        endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
                        month: z.string().optional().describe('Month in YYYY-MM format (e.g., 2026-02)'),
                        startMonth: z.string().optional().describe('Start month in YYYY-MM format'),
                        endMonth: z.string().optional().describe('End month in YYYY-MM format'),
                        confirmed: z.boolean().optional().describe('Must be true to proceed with deletion')
                    }),
                    execute: async ({ projectId, startDate, endDate, month, startMonth, endMonth, confirmed }: {
                        projectId?: string,
                        startDate?: string,
                        endDate?: string,
                        month?: string,
                        startMonth?: string,
                        endMonth?: string,
                        confirmed?: boolean
                    }) => {
                        try {
                            if (!confirmed) {
                                // Build description of what will be deleted
                                let description = '';
                                if (month) {
                                    description = `all work logs for ${month}`;
                                } else if (startDate && endDate) {
                                    description = `work logs from ${startDate} to ${endDate}`;
                                } else if (startMonth && endMonth) {
                                    description = `work logs from ${startMonth} to ${endMonth}`;
                                }
                                if (projectId) {
                                    const projectName = availableProjects.find((p: any) => p.id === projectId || p.name.toLowerCase() === projectId.toLowerCase())?.name || projectId;
                                    description += ` for project ${projectName}`;
                                }

                                return {
                                    success: false,
                                    message: `CONFIRMATION REQUIRED: This will delete ${description}. User said yes? Call this tool again with the EXACT same parameters plus confirmed=true.`,
                                    requiresConfirmation: true
                                };
                            }

                            let whereClause: any = { employeeId };

                            // Handle project filtering
                            if (projectId) {
                                let targetProjectId = projectId;
                                const lowerInput = projectId.toLowerCase();
                                if (availableProjectMap[lowerInput]) {
                                    targetProjectId = availableProjectMap[lowerInput];
                                }
                                whereClause.projectId = targetProjectId;
                            }

                            // Handle date range
                            if (startDate && endDate) {
                                whereClause.date = {
                                    gte: new Date(startDate),
                                    lte: new Date(endDate)
                                };
                            } else if (month) {
                                // Single month (e.g., "2026-02")
                                const [year, monthNum] = month.split('-');
                                const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                                const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0);
                                whereClause.date = {
                                    gte: startOfMonth,
                                    lte: endOfMonth
                                };
                            } else if (startMonth && endMonth) {
                                // Month range
                                const [startYear, startMonthNum] = startMonth.split('-');
                                const [endYear, endMonthNum] = endMonth.split('-');
                                const startOfRange = new Date(parseInt(startYear), parseInt(startMonthNum) - 1, 1);
                                const endOfRange = new Date(parseInt(endYear), parseInt(endMonthNum), 0);
                                whereClause.date = {
                                    gte: startOfRange,
                                    lte: endOfRange
                                };
                            } else {
                                return { success: false, message: 'Please provide either a date range, month, or month range.' };
                            }

                            const deletedLogs = await prisma.workLog.deleteMany({
                                where: whereClause
                            });

                            const projectName = projectId ? (availableProjects.find((p: any) => p.id === projectId || p.name.toLowerCase() === projectId.toLowerCase())?.name || 'specified project') : 'all projects';
                            return { success: true, message: `Deleted ${deletedLogs.count} work log(s) for ${projectName}.` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                deleteBulkVacations: {
                    description: 'Delete multiple vacation logs by date range, month, or month range. Requires confirmation.',
                    inputSchema: z.object({
                        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
                        endDate: z.string().optional().describe('End date in YYYY-MM-DD format'),
                        month: z.string().optional().describe('Month in YYYY-MM format (e.g., 2026-02)'),
                        startMonth: z.string().optional().describe('Start month in YYYY-MM format'),
                        endMonth: z.string().optional().describe('End month in YYYY-MM format'),
                        confirmed: z.boolean().optional().describe('Must be true to proceed with deletion')
                    }),
                    execute: async ({ startDate, endDate, month, startMonth, endMonth, confirmed }: {
                        startDate?: string,
                        endDate?: string,
                        month?: string,
                        startMonth?: string,
                        endMonth?: string,
                        confirmed?: boolean
                    }) => {
                        try {
                            if (!confirmed) {
                                let description = '';
                                if (month) {
                                    description = `all vacations for ${month}`;
                                } else if (startDate && endDate) {
                                    description = `vacations from ${startDate} to ${endDate}`;
                                } else if (startMonth && endMonth) {
                                    description = `vacations from ${startMonth} to ${endMonth}`;
                                }

                                return {
                                    success: false,
                                    message: `CONFIRMATION REQUIRED: This will delete ${description}. User said yes? Call this tool again with the EXACT same parameters plus confirmed=true.`,
                                    requiresConfirmation: true
                                };
                            }

                            let whereClause: any = { employeeId };

                            // Handle date range
                            if (startDate && endDate) {
                                whereClause.date = {
                                    gte: new Date(startDate),
                                    lte: new Date(endDate)
                                };
                            } else if (month) {
                                const [year, monthNum] = month.split('-');
                                const startOfMonth = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                                const endOfMonth = new Date(parseInt(year), parseInt(monthNum), 0);
                                whereClause.date = {
                                    gte: startOfMonth,
                                    lte: endOfMonth
                                };
                            } else if (startMonth && endMonth) {
                                const [startYear, startMonthNum] = startMonth.split('-');
                                const [endYear, endMonthNum] = endMonth.split('-');
                                const startOfRange = new Date(parseInt(startYear), parseInt(startMonthNum) - 1, 1);
                                const endOfRange = new Date(parseInt(endYear), parseInt(endMonthNum), 0);
                                whereClause.date = {
                                    gte: startOfRange,
                                    lte: endOfRange
                                };
                            } else {
                                return { success: false, message: 'Please provide either a date range, month, or month range.' };
                            }

                            const vacationCount = await prisma.vacationLog.count({ where: whereClause });

                            await prisma.vacationLog.deleteMany({
                                where: whereClause
                            });

                            // Refund vacation days
                            await prisma.employee.update({
                                where: { id: employeeId },
                                data: { vacationDays: { increment: vacationCount } }
                            });

                            return { success: true, message: `Deleted ${vacationCount} vacation log(s) and refunded ${vacationCount} day(s).` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                },
                clearAllLogs: {
                    description: 'Clear all logs for the employee. Dangerous.',
                    inputSchema: z.object({
                        confirm: z.boolean().describe('Must be true to proceed')
                    }),
                    execute: async ({ confirm }: { confirm: boolean }) => {
                        if (!confirm) return { success: false, message: 'Action cancelled.' };
                        await clearAllLogs(employeeId);
                        return { success: true, message: 'All logs cleared.' };
                    }
                },
                deleteDuplicateWorkLogs: {
                    description: 'Search for and delete redundant work logs in a date range, leaving only one copy per project per day.',
                    inputSchema: z.object({
                        startDate: z.string().optional().describe('Start date in YYYY-MM-DD format'),
                        endDate: z.string().optional().describe('End date in YYYY-MM-DD format')
                    }),
                    execute: async ({ startDate, endDate }: { startDate?: string, endDate?: string }) => {
                        try {
                            const result = await deleteDuplicateWorkLogs(
                                employeeId,
                                startDate ? new Date(startDate) : undefined,
                                endDate ? new Date(endDate) : undefined
                            );
                            return { success: true, message: `Found and deleted ${result.deletedCount} redundant work log(s).` };
                        } catch (err: any) {
                            return { success: false, message: `Error: ${err.message}` };
                        }
                    }
                }
            }
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error('CHAT_ROUTE_ERROR:', error);
        return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
