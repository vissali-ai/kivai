import "server-only";

import { assertBlogDatabaseConfigured, blogConfig } from "@/lib/blog/config";

type RequestOptions = RequestInit & {
  allowMissingConfig?: boolean;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

const PUBLIC_REVALIDATE_SECONDS = 300;

function getPublicReadCache(path: string, options: RequestOptions) {
  const method = (options.method ?? "GET").toUpperCase();
  const isPublishedRead = method === "GET" && path.includes("status=eq.published");

  if (!isPublishedRead) {
    return {
      cache: "no-store" as const,
      next: undefined,
    };
  }

  return {
    cache: "force-cache" as const,
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  };
}

export async function supabaseRest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (options.allowMissingConfig && !blogConfig.supabaseUrl) return [] as T;
  assertBlogDatabaseConfigured();
  let response: Response;
  const cacheOptions = getPublicReadCache(path, options);

  try {
    response = await fetch(`${blogConfig.supabaseUrl}/rest/v1/${path}`, {
      ...options,
      ...cacheOptions,
      headers: {
        apikey: blogConfig.serviceRoleKey,
        Authorization: `Bearer ${blogConfig.serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Não foi possível conectar ao Supabase. Copie novamente a Project URL no painel e reinicie o servidor.");
  }
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase (${response.status}): ${detail}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function supabaseStorage(path: string, options: RequestInit) {
  assertBlogDatabaseConfigured();
  const response = await fetch(`${blogConfig.supabaseUrl}/storage/v1/${path}`, {
    ...options,
    headers: {
      apikey: blogConfig.serviceRoleKey,
      Authorization: `Bearer ${blogConfig.serviceRoleKey}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`Storage (${response.status}): ${await response.text()}`);
  return response;
}

export function publicStorageUrl(path: string) {
  return `${blogConfig.supabaseUrl}/storage/v1/object/public/${blogConfig.storageBucket}/${path}`;
}
