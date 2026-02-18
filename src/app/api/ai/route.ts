import { openai } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const systemPrompt = `You are LifeOS Coach — a sharp, direct, and encouraging personal operating system advisor.
You help the user stay aligned with their values, make better decisions, build habits, and execute with clarity.
Keep responses concise (2-4 sentences max unless asked for more). Be direct, not fluffy.
Use the user's life context below to give personalized, grounded advice.

USER CONTEXT:
${context ?? "No context provided."}

Rules:
- Never be generic. Always tie advice back to the user's specific values, habits, or goals.
- When the user shares a struggle, diagnose the real cause, not just the symptom.
- Celebrate wins briefly, then redirect to the next move.
- If asked for a plan, give a numbered list. Otherwise, prose is fine.`;

  const result = await streamText({
    model: openai("gpt-4o-mini"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 512,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
