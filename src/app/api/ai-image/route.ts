import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const IMAGE_MODEL_PRIMARY = "gemini-2.5-flash-image-preview";
const IMAGE_MODEL_FALLBACK = "gemini-2.5-flash-image";

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        inlineData?: {
          mimeType?: string;
          data?: string;
        };
      }>;
    };
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
};

async function tryGenerateImage(
  apiKey: string,
  model: string,
  prompt: string,
  aspectRatio: string
): Promise<{ imageDataUrl: string | null; error?: string }> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: { aspectRatio },
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as GeminiGenerateResponse;
  if (!response.ok) {
    return { imageDataUrl: null, error: data.error?.message || `HTTP ${response.status}` };
  }

  for (const candidate of data.candidates || []) {
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData?.data) {
        const mime = part.inlineData.mimeType || "image/png";
        return { imageDataUrl: `data:${mime};base64,${part.inlineData.data}` };
      }
    }
  }

  return { imageDataUrl: null, error: `${model} returned no image payload.` };
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GOOGLE_GENERATIVE_AI_API_KEY is not configured." }, { status: 500 });
    }

    const body = await req.json();
    const prompt = String(body?.prompt || "").trim();
    const aspectRatio = String(body?.aspectRatio || "16:9").trim();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
    }

    const primary = await tryGenerateImage(apiKey, IMAGE_MODEL_PRIMARY, prompt, aspectRatio);
    if (primary.imageDataUrl) {
      return NextResponse.json({ image: primary.imageDataUrl, model: IMAGE_MODEL_PRIMARY });
    }

    const fallback = await tryGenerateImage(apiKey, IMAGE_MODEL_FALLBACK, prompt, aspectRatio);
    if (fallback.imageDataUrl) {
      return NextResponse.json({ image: fallback.imageDataUrl, model: IMAGE_MODEL_FALLBACK });
    }

    return NextResponse.json(
      {
        error: fallback.error || primary.error || "Image generation failed.",
        primaryModel: IMAGE_MODEL_PRIMARY,
        fallbackModel: IMAGE_MODEL_FALLBACK,
      },
      { status: 502 }
    );
  } catch (err) {
    console.error("[/api/ai-image] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown image generation error" },
      { status: 500 }
    );
  }
}

