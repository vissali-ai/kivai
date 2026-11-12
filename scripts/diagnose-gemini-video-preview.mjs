// Temporary, preview-branch-only provider smoke test. Never prints keys or response content.
const branch = "feature/preview-transcricao-resumo-youtube-20261112";
if (process.env.VERCEL_ENV !== "preview" || process.env.VERCEL_GIT_COMMIT_REF !== branch) {
  process.exit(0);
}
const key = process.env.GEMINI_API_KEY;
const base = "https://generativelanguage.googleapis.com/v1beta";
if (!key) { console.log("[video-diag] no GEMINI_API_KEY available at build"); process.exit(0); }
const auth = { "x-goog-api-key": key, "Content-Type": "application/json" };
async function check(label, uri, body, timeout = 20000) {
  try {
    const result = await fetch(uri, {
      headers: auth,
      ...(body ? { method: "POST", body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(timeout),
      cache: "no-store"
    });
    const response = await result.json().catch(() => ({}));
    const error = response.error;
    console.log("[video-diag]", label, "HTTP", result.status, error ? "code="+(error.status || error.code || "unknown") : "ok");
    if (result.ok) {
      if (Array.isArray(response.models)) {
        const models = response.models.filter(m=>/gemini-(3.8-flash|3.7-flash|3.5-flash-lite|2.5-flash)/.test(m.name || ""))
          .map(m=>({name:m.name,methods:m.supportedGenerationMethods}));
        console.log("[video-diag] selected models", JSON.stringify(models).slice(0,1800));
      } else {
        console.log("[video-diag]",label, "shape",Object.keys(response).join(","),
          "steps",response.steps?.length??"n/a",
          "output",typeof response.output_text==="string"?response.output_text.length:"n/a",
          "candidates",response.candidates?.length??"n/a");
      }
    }
    return result.status;
  } catch (error) {
    console.log("[video-diag]",label,"exception",error?.name||"unknown");
    return -1;
  }
}
await check("models", base + "/models?pageSize=1000");
await check("text-3.7",base+"/models/gemini-3.7-flash:generateContent",{contents:[{parts:[{text:"Responda apenas OK."}]}],generationConfig:{maxOutputTokens:30}},15000);
await check("youtube-3.5-lite",base+"/interactions",{model:"gemini-3.5-flash-lite",input:[{type:"text",text:"What is happening in this video? Answer in one short sentence."},{type:"video",uri:"https://www.youtube.com/watch?v=9hE5-98ZeCg"}]},25000);

console.log("[video-diag] completed");
