import { createOpenAI } from '@ai-sdk/openai';
import { streamText, convertToModelMessages, stepCountIs } from 'ai';
import { z } from 'zod';
import { logWork, logVacation, deleteWorkLog, updateWorkLog } from '@/app/actions/worklogs';
import { getEmployeeSession } from '@/app/lib/auth';
import { prisma } from '@/app/lib/prisma';

const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

// Allow streaming responses up to 60 seconds for local LLM
export const maxDuration = 60;

export async function POST(req: Request) {
    const { messages } = await req.json();
    const session = await getEmployeeSession();

    if (!session || typeof session.id !== 'string') {
        return new Response('Unauthorized', { status: 401 });
    }

    const employeeId = session.id;

    // STRICT SANITIZATION V2 - FORCE UPDATE
    console.log('Incoming messages raw count:', messages.length);

    // Ultra-minimal mapping to absolutely rule out any unsupported metadata or part types
    const modelMessages = messages.map((m: any) => {
        let content = '';
        if (typeof m.content === 'string') {
            content = m.content;
        } else if (Array.isArray(m.parts)) {
            content = m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('\n');
        } else if (m.content) {
            content = String(m.content);
        }

        return {
            role: m.role,
            content: content || ' '
        };
    })
        .filter((m: any) => m.role === 'user' || m.role === 'assistant') // ONLY allow simple roles
        .map((m: any) => ({
            role: m.role,
            content: m.content
        })) as any[];

    console.log('Sanitized messages (Strict):', JSON.stringify(modelMessages, null, 2));

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

    console.log('--- STEP 5: BINARY SEARCH TOOLS ---');
    console.log('Testing ONLY getRecentWorkLogs.');

    const result = streamText({
        model: ollama('llama3.2'),
        messages: [{ role: 'user', content: 'List my recent logs.' }],
        stopWhen: stepCountIs(5),
        system: `You are a helpful assistant.`,
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
            // logWork: { ... } // DISABLED
            // updateWorkLog: { ... } // DISABLED
            // deleteWorkLog: { ... } // DISABLED
            // logVacation: { ... } // DISABLED
        }
    });

    return result.toUIMessageStreamResponse();
}
