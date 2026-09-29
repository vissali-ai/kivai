import http from "node:http";

// Isolated, read-only Supabase substitute for the Next.js publication smoke test.
http.createServer((request, response) => {
  const url = new URL(request.url, "http://127.0.0.1");
  if (request.method !== "GET") {
    response.writeHead(405).end();
    return;
  }
  response.setHeader("Content-Type", "application/json");
  const archived = url.pathname === "/rest/v1/site_contents" && url.searchParams.get("status") === "eq.archived";
  response.end(JSON.stringify(archived ? [{ existing_tool_slug: "descompactar-zip" }] : []));
}).listen(3198, "127.0.0.1");
