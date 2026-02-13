import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
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
    .filter((msg: any) => msg.role === "user" || msg.role === "assistant")
    .map((msg: any) => {
      let content = "";

      if (msg.parts && Array.isArray(msg.parts)) {
        content = msg.parts
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join(" ");
      }
      else if (typeof msg.content === "string") {
        content = msg.content;
      }
      else if (Array.isArray(msg.content)) {
        content = msg.content
          .filter((part: any) => part.type === "text")
          .map((part: any) => part.text)
          .join(" ");
      }

      return {
        role: msg.role,
        content: content || "Hello",
      };
    })
    .filter((msg: any) => msg.content.trim().length > 0);

  // Fetch recent work logs to provide to LLM
  
  const logs = await prisma.workLog.findMany({
    where: { employeeId },
    orderBy: { date: 'desc' },
    take: 10,
    include: { project: true }
  });
  
  let logsContext = '';
  if (logs.length > 0) {
    logsContext = `\n\nRECENT WORK LOGS:\n${logs.map(l => 
      `- ${l.date.toISOString().split('T')[0]}: ${l.hours} hours on ${l.project.name}`
    ).join('\n')}`;
  } else {
    logsContext = `\n\nRECENT WORK LOGS: No logs found yet.`;
  }

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
    employeeWithProjects?.projects.map((p: any) => ({
      id: p.project.id as string,
      name: p.project.name as string,
    })) || [];

  const systemPrompt = `You are a helpful work logging assistant for employees. 

Current Date: ${new Date().toISOString().split("T")[0]}

Available Projects:
${availableProjects.map((p: any) => `- ${p.name}`).join("\n")}
${logsContext}

When the user asks about their work logs, show them the information from RECENT WORK LOGS above.
Be concise and friendly.`;

  const result = streamText({
    model: ollama("llama3.2"),
    messages: cleanMessages,
    system: systemPrompt,
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
