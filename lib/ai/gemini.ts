import "server-only";

const MODEL = "gemini-2.5-flash-lite";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export class GeminiRequestError extends Error {
  constructor(public readonly status: number) {
    super("GEMINI_REQUEST_FAILED");
  }
}

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
};

export async function requestGeminiJson(systemInstruction: string, payload: unknown): Promise<unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new GeminiRequestError(503);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(22_000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(payload) }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.2,
          maxOutputTokens: 1400,
        },
      }),
    });
  } catch {
    throw new GeminiRequestError(503);
  }

  if (!response.ok) {
    // Do not log provider response bodies, prompts or API keys.
    console.warn("[kivai-ai] Gemini returned HTTP", response.status);
    throw new GeminiRequestError(response.status === 429 ? 429 : 503);
  }

  const json = (await response.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!text) throw new GeminiRequestError(503);

  try {
    return JSON.parse(text);
  } catch {
    throw new GeminiRequestError(503);
  }
}
