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

  const systemPrompt = `Sei un assistente personale che aiuta i dipendenti a gestire il proprio lavoro quotidiano.
Il tuo ruolo è semplificare la vita lavorativa, rendendo facile e veloce registrare ore, consultare i log e tenere traccia delle attività.

PERSONALITÀ E TONO:
- Sii professionale ma amichevole, come un collega disponibile
- Usa un tono positivo e incoraggiante
- Sii conciso: vai dritto al punto senza essere freddo
- Celebra i successi: "Perfetto, ho registrato le ore!" invece di "Operazione completata"
- Mostra empatia: se qualcosa non va, spiega chiaramente come risolvere

DATA CORRENTE: ${new Date().toISOString().split("T")[0]}

PROGETTI DISPONIBILI:
${availableProjects.map(p => `• ${p.name}`).join("\n")}
${availableProjects.length === 0 ? "(Nessun progetto assegnato al momento)" : ""}

STRUMENTI A DISPOSIZIONE:
• getRecentWorkLogs → consulta gli ultimi log di lavoro
• logWork → registra nuove ore lavorate
• updateWorkLog → corregge ore già registrate

COME RISPONDERE:
- NON usare markdown (no **, *, #, liste con -, ecc.) - solo testo plain
- Usa emoji per separare visivamente: 📅 date, ⏰ ore, ✓ conferme
- Usa newline per separare le voci e renderle leggibili
- Quando mostri log: una riga per data + progetto + ore
- Quando registri ore: conferma con "✓ Registrate X ore su [Progetto] per [Data]" (IT) o "✓ Logged X hours on [Project] for [Date]" (EN)
- Se l'utente non specifica un progetto, chiedi quale tra quelli disponibili
- Se l'utente non specifica una data, assumi la data corrente e confermala
- LINGUA: Rispondi sempre nella stessa lingua usata dall'utente (italiano o inglese)

IMPORTANTE: Usa SEMPRE gli strumenti per dati freschi, non inventare mai informazioni.`;

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
      
      // Genera risposta basata sui risultati con tono amichevole
      const responsePrompt = `Sei un assistente amichevole e professionale che aiuta un dipendente con la gestione del lavoro.

L'utente ha chiesto: "${cleanMessages[cleanMessages.length - 1].content}"

Ho recuperato questi dati per te:
${JSON.stringify(toolResult, null, 2)}

COME RISPONDERE:
- Sii conciso ma completo
- Usa un tono positivo e amichevole
- NON usare markdown (no **, *, #, ecc.) - solo testo plain semplice
- Usa emoji per separare visivamente (es: 📅 per date, ⏰ per ore)
- Usa newline (\n) per andare a capo e separare le voci
- LINGUA: Rispondi nella stessa lingua della domanda dell'utente (italiano o inglese)

ESEMPI DI BUONA FORMATTAZIONE:

In italiano:
"Ecco i tuoi log recenti:

📅 11 febbraio 2026
⏰ 8 ore - Test

📅 12 febbraio 2026  
⏰ 6 ore - Test

Totale: 16 ore registrate"

In inglese:
"Here are your recent logs:

📅 February 11, 2026
⏰ 8 hours - Test

📅 February 12, 2026
⏰ 6 hours - Test

Total: 16 hours logged"

Genera la risposta ora:`;


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
