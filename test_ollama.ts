import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { z } from 'zod';

const ollama = createOpenAI({
    baseURL: 'http://localhost:11434/v1',
    apiKey: 'ollama',
});

async function main() {
    console.log("Testing Ollama connection WITH TOOLS...");
    try {
        const result = streamText({
            model: ollama('llama3.2'),
            messages: [
                { role: 'user', content: 'What is the weather in Paris?' }
            ],
            tools: {
                weather: {
                    description: 'Get the weather',
                    parameters: z.object({ city: z.string() }),
                    execute: async ({ city }) => ({ temperature: 22 })
                }
            }
        });

        for await (const textPart of result.textStream) {
            process.stdout.write(textPart);
        }
        console.log("\nSuccess!");
    } catch (error) {
        console.error("\nError:", error);
    }
}

main();
