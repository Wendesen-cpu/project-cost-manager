import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { z } from "zod";
import { getEmployeeSession } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

// Configure Ollama as OpenAI-compatible provider
const ollama = createOpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "ollama", // Ollama doesn't require API key but SDK needs one
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  const session = await getEmployeeSession();

  if (!session || typeof session.id !== "string") {
    return new Response("Unauthorized", { status: 401 });
  }

  const employeeId = session.id;

  // Clean messages - extract only text content, ignore tool calls
  const cleanMessages = messages
    .filter((msg: { role: string }) => msg.role === "user" || msg.role === "assistant")
    .map((msg: { role: string; parts?: unknown[]; content?: string | unknown[] }) => {
      let content = "";

      if (msg.parts && Array.isArray(msg.parts)) {
        content = (msg.parts as Array<{ type?: string; text?: string }>)
          .filter(part => part.type === "text")
          .map(part => part.text || "")
          .join(" ");
      }
      else if (typeof msg.content === "string") {
        content = msg.content;
      }
      else if (Array.isArray(msg.content)) {
        content = (msg.content as Array<{ type?: string; text?: string }>)
          .filter(part => part.type === "text")
          .map(part => part.text || "")
          .join(" ");
      }

      return {
        role: msg.role,
        content: content.trim() || (msg.role === "assistant" ? "" : "ciao"),
      };
    })
    .filter((msg: { role: string; content: string }) => {
      if (msg.role === "user") return msg.content.trim().length > 0;
      if (msg.role === "assistant") return msg.content.trim().length > 0;
      return false;
    });

  // Fetch projects for tool context
  const employeeWithProjects = await prisma.employee.findUnique({
    where: { id: employeeId },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });

  const availableProjects =
    employeeWithProjects?.projects.map(p => ({
      id: p.project.id,
      name: p.project.name,
    })) || [];

  const systemPrompt = `Sei un assistente che aiuta a gestire i log di lavoro. Rispondi SOLO in italiano.

Data corrente: ${new Date().toISOString().split("T")[0]}

Progetti disponibili:
${availableProjects.map(p => `- ${p.name}`).join("\n")}

IMPORTANTE: Hai questi strumenti a disposizione:
- getRecentWorkLogs: mostra gli ultimi log di lavoro
- logWork: registra nuove ore di lavoro  
- updateWorkLog: modifica ore già registrate

Quando l'utente chiede di vedere i log, USA SEMPRE getRecentWorkLogs.
Quando l'utente vuole registrare ore, USA SEMPRE logWork.
Quando l'utente vuole modificare ore, USA ALWAYS updateWorkLog.

Non inventare dati - usa SEMPRE gli strumenti per ottenere informazioni fresche.`;

  const toolsConfig = {
    getRecentWorkLogs: {
      description: "Get the list of recent work logs for the current employee",
      inputSchema: z.object({
        limit: z.number().optional().describe("Number of logs to retrieve (default 10)"),
      }),
      execute: async ({ limit = 10 }: { limit?: number }) => {
        try {
          const recentLogs = await prisma.workLog.findMany({
            where: { employeeId },
            orderBy: { date: 'desc' },
            take: limit,
            include: { project: true }
          });

          if (recentLogs.length === 0) {
            return {
              success: true,
              logs: [],
              message: "Nessun log trovato.",
            };
          }

          return {
            success: true,
            logs: recentLogs.map(l => ({
              id: l.id,
              date: l.date.toISOString().split('T')[0],
              projectName: l.project.name,
              hours: l.hours,
            })),
            message: `Trovati ${recentLogs.length} log.`,
          };
        } catch (error) {
          return {
            success: false,
            message: `Errore nel recupero dei log: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
          };
        }
      },
    },
    logWork: {
      description: "Log work hours for a specific project and date",
      inputSchema: z.object({
        projectName: z.string().describe("Name of the project to log hours for"),
        date: z.string().describe("Date in YYYY-MM-DD format"),
        hours: z.number().describe("Number of hours worked"),
      }),
      execute: async ({ projectName, date, hours }: { projectName: string; date: string; hours: number }) => {
        try {
          const project = availableProjects.find(
            p => p.name.toLowerCase() === projectName.toLowerCase()
          );

          if (!project) {
            return {
              success: false,
              message: `Progetto "${projectName}" non trovato. Progetti disponibili: ${availableProjects.map(p => p.name).join(", ")}`,
            };
          }

          const workLog = await prisma.workLog.create({
            data: {
              employeeId,
              projectId: project.id,
              date: new Date(date),
              hours,
            },
          });

          return {
            success: true,
            message: `Registrate ${hours} ore per ${projectName} il ${date}`,
            logId: workLog.id,
          };
        } catch (error) {
          return {
            success: false,
            message: `Errore nel logging: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
          };
        }
      },
    },
    updateWorkLog: {
      description: "Update hours for an existing work log entry",
      inputSchema: z.object({
        logId: z.string().describe("ID of the work log to update"),
        newHours: z.number().describe("New number of hours"),
      }),
      execute: async ({ logId, newHours }: { logId: string; newHours: number }) => {
        try {
          const existingLog = await prisma.workLog.findFirst({
            where: {
              id: logId,
              employeeId,
            },
            include: { project: true },
          });

          if (!existingLog) {
            return {
              success: false,
              message: "Log non trovato o non hai i permessi per modificarlo",
            };
          }

          const updatedLog = await prisma.workLog.update({
            where: { id: logId },
            data: { hours: newHours },
            include: { project: true },
          });

          return {
            success: true,
            message: `Aggiornato log per ${updatedLog.project.name} del ${updatedLog.date.toISOString().split('T')[0]} da ${existingLog.hours} a ${newHours} ore`,
            oldHours: existingLog.hours,
            newHours: newHours,
          };
        } catch (error) {
          return {
            success: false,
            message: `Errore nell'aggiornamento: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`,
          };
        }
      },
    },
  };

  const result = await generateText({
    model: ollama("llama3.1"),
    messages: cleanMessages,
    system: systemPrompt,
    temperature: 0.7,
    tools: toolsConfig,
  });

  // Se non ha generato testo ma ha chiamato tool, genera una risposta dai risultati
  if (result.text.length === 0 && result.steps && result.steps.length > 0) {
    const lastStep = result.steps[result.steps.length - 1];
    if (lastStep.toolResults && lastStep.toolResults.length > 0) {
      const toolResult = lastStep.toolResults[0];
      
      // Genera risposta basata sui risultati
      const responsePrompt = `L'utente ha chiesto: "${cleanMessages[cleanMessages.length - 1].content}"
      
Ho ottenuto questi dati:
${JSON.stringify(toolResult, null, 2)}

Rispondi all'utente in italiano in modo chiaro e conciso, presentando i dati in modo leggibile.`;

      const secondResult = await generateText({
        model: ollama("llama3.1"),
        messages: [{ role: 'user', content: responsePrompt }],
        temperature: 0.7,
      });
      
      return new Response(secondResult.text, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
  }

  return new Response(result.text || 'Nessuna risposta generata.', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
