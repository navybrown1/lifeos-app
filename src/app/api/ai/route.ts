import { google } from "@ai-sdk/google";
import { streamText } from "ai";

// Use Node.js runtime so errors surface properly (edge silently drops them)
export const runtime = "nodejs";

type IncomingMessage = {
  role: "user" | "assistant";
  content?: string;
  parts?: Array<{ type: string; text?: string }>;
};

function toModelMessages(messages: IncomingMessage[]) {
  return messages.map((m) => {
    // Support both plain content string and v4 parts array
    const text =
      m.content ??
      (m.parts ?? [])
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("") ??
      "";
    return { role: m.role as "user" | "assistant", content: text };
  });
}

export async function POST(req: Request) {
  try {
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
      model: google("gemini-1.5-flash"),
      system: systemPrompt,
      messages: toModelMessages(messages),
      maxOutputTokens: 512,
      temperature: 0.7,
    });

    return result.toTextStreamResponse();
  } catch (err) {
    console.error("[/api/ai] Error:", err);
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
