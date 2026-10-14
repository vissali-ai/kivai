import "server-only";

// Gemini 2.5 is access-restricted for projects that did not use it previously.
// Prefer models supported by new Gemini API projects, with a Free Tier.
const MODELS = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite"] as const;

export class GeminiRequestError extends Error {
  constructor(public readonly status: number) {
    super("GEMINI_REQUEST_FAILED");
  }
}

type GeminiResponse = {
  candidates?: Array<{
    finishReason?: string;
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

export async function requestGeminiJson(systemInstruction: string, payload: unknown): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiRequestError(503);

  for (const [index, model] of MODELS.entries()) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          cache: "no-store",
          signal: AbortSignal.timeout(22_000),
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
            generationConfig: {
              responseMimeType: "application/json",
              maxOutputTokens: 2048,
            },
          }),
        },
      );
    } catch {
      throw new GeminiRequestError(503);
    }

    if (!response.ok) {
      // Never log provider response bodies, API keys, prompts or user data.
      console.warn("[kivai-ai] Gemini model/status", model, response.status);

      // Model access can differ by API project. Try one other free model only
      // for "not found"; never circumvent provider quota or billing errors.
      if (response.status === 404 && index < MODELS.length - 1) continue;

      throw new GeminiRequestError(
        response.status === 404 ? 404 : response.status === 429 ? 429 : 503,
      );
    }

    let json: GeminiResponse;
    try {
      json = (await response.json()) as GeminiResponse;
    } catch {
      throw new GeminiRequestError(503);
    }

    const candidate = json.candidates?.[0];
    const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) {
      console.warn("[kivai-ai] Gemini empty output", model, candidate?.finishReason ?? "unknown");
      throw new GeminiRequestError(503);
    }

    try {
      return JSON.parse(text);
    } catch {
      console.warn("[kivai-ai] Gemini invalid JSON", model);
      throw new GeminiRequestError(503);
    }
  }

  throw new GeminiRequestError(404);
}
