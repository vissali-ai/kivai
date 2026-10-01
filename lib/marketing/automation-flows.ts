import "server-only";

import { listAdminCustomers } from "@/lib/admin/customer-users";
import { supabaseRest } from "@/lib/blog/supabase";
import { deliverCustomerEmail } from "@/lib/marketing/email-delivery";
import { tools } from "@/lib/tools";

export type AutomationTrigger =
  | "account_created"
  | "plan_activated"
  | "pro_test_started"
  | "pro_test_ending"
  | "blog_published"
  | "tool_published";

export type AutomationAudience = "all" | "free" | "pro" | "agency" | "trial";

export type AutomationFlow = {
  id: string;
  name: string;
  trigger_key: AutomationTrigger;
  audience: AutomationAudience;
  delay_hours: number;
  subject: string;
  message: string;
  cta_label: string | null;
  cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type Subscription = {
  id: string;
  user_id: string;
  plan_code: "pro" | "agency";
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  test_access: boolean;
};

type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  published_at: string | null;
};

type ToolDispatch = {
  source_id: string;
  dispatched_at: string;
  dispatch_kind: string;
};

type Candidate = {
  eventKey: string;
  eventAt: Date;
  userId?: string;
  sourceType: string;
  sourceId: string;
  values: Record<string, string>;
};

const SITE_URL = "https://www.kivai.com.br";
const LOOKBACK_DAYS = 45;

export const automationTriggerOptions: Array<{ key: AutomationTrigger; label: string; description: string }> = [
  { key: "account_created", label: "Novo cadastro", description: "Quando uma nova conta é criada." },
  { key: "plan_activated", label: "Plano pago ativado", description: "Quando Pro ou Agency é ativado, sem considerar acessos de teste." },
  { key: "pro_test_started", label: "Teste Pro iniciado", description: "Quando os 7 dias de teste Pro começam." },
  { key: "pro_test_ending", label: "Último dia do teste Pro", description: "Quando faltam aproximadamente 24 horas para o fim do teste." },
  { key: "blog_published", label: "Post publicado", description: "Quando uma nova publicação entra no blog." },
  { key: "tool_published", label: "Ferramenta lançada", description: "Quando uma nova ferramenta é identificada no fluxo de lançamentos." },
];

export const automationAudienceOptions: Array<{ key: AutomationAudience; label: string }> = [
  { key: "all", label: "Todos os usuários" },
  { key: "free", label: "Plano Grátis" },
  { key: "pro", label: "Plano Pro" },
  { key: "agency", label: "Plano Agency" },
  { key: "trial", label: "Usuários em teste" },
];

export async function listAutomationFlows() {
  return supabaseRest<AutomationFlow[]>("automation_flows?select=*&order=created_at.desc");
}

function firstName(value: string | null | undefined) {
  return value?.trim().split(/\s+/)[0] || "Olá";
}

function replaceVariables(value: string, variables: Record<string, string>) {
  let output = value;
  for (const [key, replacement] of Object.entries(variables)) {
    output = output.replaceAll(`{{${key}}}`, replacement);
  }
  return output;
}

function matchesAudience(
  user: Awaited<ReturnType<typeof listAdminCustomers>>[number],
  audience: AutomationAudience,
) {
  if (audience === "free") return user.planCode === "free";
  if (audience === "pro") return user.planCode === "pro";
  if (audience === "agency") return user.planCode === "agency";
  if (audience === "trial") return user.testAccess || user.lifecycleStage === "trial";
  return true;
}

async function buildCandidates(trigger: AutomationTrigger, users: Awaited<ReturnType<typeof listAdminCustomers>>) {
  const cutoff = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const candidates: Candidate[] = [];

  if (trigger === "account_created") {
    for (const user of users) {
      const eventAt = new Date(user.createdAt);
      if (eventAt < cutoff) continue;
      candidates.push({
        eventKey: `account_created_${user.id}_${user.createdAt}`,
        eventAt,
        userId: user.id,
        sourceType: "account",
        sourceId: user.id,
        values: { nome: firstName(user.fullName), email: user.email, plano: user.planCode.toUpperCase() },
      });
    }
    return candidates;
  }

  if (["plan_activated", "pro_test_started", "pro_test_ending"].includes(trigger)) {
    const subscriptions = await supabaseRest<Subscription[]>(
      "user_subscriptions?select=id,user_id,plan_code,status,current_period_start,current_period_end,test_access&current_period_start=not.is.null&order=current_period_start.desc&limit=1000",
    );
    for (const subscription of subscriptions) {
      if (subscription.status !== "active") continue;
      if (trigger === "plan_activated" && subscription.test_access) continue;
      if ((trigger === "pro_test_started" || trigger === "pro_test_ending") && !subscription.test_access) continue;
      const raw = trigger === "pro_test_ending"
        ? subscription.current_period_end
        : subscription.current_period_start;
      if (!raw) continue;
      const sourceDate = new Date(raw);
      const eventAt = trigger === "pro_test_ending"
        ? new Date(sourceDate.getTime() - 24 * 60 * 60 * 1000)
        : sourceDate;
      if (eventAt < cutoff) continue;
      const user = users.find((item) => item.id === subscription.user_id);
      candidates.push({
        eventKey: `${trigger}_${subscription.id}_${raw}`,
        eventAt,
        userId: subscription.user_id,
        sourceType: "subscription",
        sourceId: subscription.id,
        values: {
          nome: firstName(user?.fullName),
          email: user?.email ?? "",
          plano: subscription.plan_code === "pro" ? "Pro" : "Agency",
          data: sourceDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        },
      });
    }
    return candidates;
  }

  if (trigger === "blog_published") {
    const posts = await supabaseRest<BlogPost[]>(
      `blog_posts?select=id,title,slug,excerpt,published_at&status=eq.published&published_at=gte.${encodeURIComponent(cutoff.toISOString())}&order=published_at.desc&limit=200`,
    );
    for (const post of posts) {
      if (!post.published_at) continue;
      candidates.push({
        eventKey: `blog_published_${post.id}_${post.published_at}`,
        eventAt: new Date(post.published_at),
        sourceType: "blog",
        sourceId: post.id,
        values: {
          titulo: post.title,
          resumo: post.excerpt,
          link: `${SITE_URL}/blog/${post.slug}`,
          data: new Date(post.published_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
        },
      });
    }
    return candidates;
  }

  const dispatches = await supabaseRest<ToolDispatch[]>(
    `content_campaign_dispatches?select=source_id,dispatched_at,dispatch_kind&source_type=eq.tool&dispatch_kind=eq.new_tool&dispatched_at=gte.${encodeURIComponent(cutoff.toISOString())}&order=dispatched_at.desc&limit=200`,
  );
  for (const dispatch of dispatches) {
    const tool = tools.find((item) => item.slug === dispatch.source_id);
    if (!tool) continue;
    candidates.push({
      eventKey: `tool_published_${dispatch.source_id}_${dispatch.dispatched_at}`,
      eventAt: new Date(dispatch.dispatched_at),
      sourceType: "tool",
      sourceId: dispatch.source_id,
      values: {
        titulo: tool.name,
        resumo: tool.description,
        link: `${SITE_URL}/ferramentas/${tool.slug}`,
        data: new Date(dispatch.dispatched_at).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      },
    });
  }
  return candidates;
}

async function processOne(
  flow: AutomationFlow,
  candidate: Candidate,
  user: Awaited<ReturnType<typeof listAdminCustomers>>[number],
) {
  if (!user.email || !matchesAudience(user, flow.audience)) return "skipped" as const;
  const scheduledFor = new Date(candidate.eventAt.getTime() + flow.delay_hours * 60 * 60 * 1000);
  if (scheduledFor.getTime() > Date.now()) return "waiting" as const;

  const variables = {
    nome: firstName(user.fullName),
    email: user.email,
    plano: user.planCode === "free" ? "Grátis" : user.planCode === "pro" ? "Pro" : "Agency",
    ...candidate.values,
  };

  const runs = await supabaseRest<Array<{ id: string }>>("automation_flow_runs?on_conflict=flow_id,event_key,user_id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({
      flow_id: flow.id,
      event_key: candidate.eventKey,
      user_id: user.id,
      source_type: candidate.sourceType,
      source_id: candidate.sourceId,
      scheduled_for: scheduledFor.toISOString(),
      status: "ready",
    }),
  });
  const run = runs[0];
  if (!run) return "duplicate" as const;

  try {
    const communications = await supabaseRest<Array<{ id: string }>>("customer_communications", {
      method: "POST",
      body: JSON.stringify({
        user_id: user.id,
        event_key: `automation_flow_${flow.id}_${run.id}`,
        channel: "email",
        status: "ready",
        subject: replaceVariables(flow.subject, variables),
        message: replaceVariables(flow.message, variables),
        cta_label: flow.cta_label ? replaceVariables(flow.cta_label, variables) : null,
        cta_url: flow.cta_url ? replaceVariables(flow.cta_url, variables) : null,
        scheduled_for: new Date().toISOString(),
        metadata: {
          source: "automatic_custom_flow",
          flow_key: "custom_automation",
          kind: "custom_automation",
          layout: "kivai_campaign",
          automation_flow_id: flow.id,
          automation_flow_name: flow.name,
          automation_run_id: run.id,
          trigger_key: flow.trigger_key,
          recipient_email: user.email,
          recipient_name: user.fullName,
          secondary_cta_label: flow.secondary_cta_label ? replaceVariables(flow.secondary_cta_label, variables) : "",
          secondary_cta_url: flow.secondary_cta_url ? replaceVariables(flow.secondary_cta_url, variables) : "",
        },
      }),
    });
    const communication = communications[0];
    if (!communication) throw new Error("Não foi possível criar a comunicação.");
    const result = await deliverCustomerEmail(communication.id);
    const status = result.status === "sent" ? "sent" : result.status === "canceled" ? "canceled" : "failed";
    const error = result.status === "failed" ? result.error : result.status === "canceled" ? result.reason : null;
    await supabaseRest(`automation_flow_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      body: JSON.stringify({
        status,
        communication_id: communication.id,
        error,
        processed_at: new Date().toISOString(),
      }),
    });
    return status;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha no fluxo automático.";
    await supabaseRest(`automation_flow_runs?id=eq.${encodeURIComponent(run.id)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "failed", error: message.slice(0, 1000), processed_at: new Date().toISOString() }),
    });
    return "failed" as const;
  }
}

export async function runCustomAutomationFlows() {
  const [flows, users] = await Promise.all([
    supabaseRest<AutomationFlow[]>("automation_flows?select=*&enabled=eq.true&order=created_at.asc"),
    listAdminCustomers(),
  ]);
  let sent = 0;
  let failed = 0;
  let canceled = 0;
  let duplicate = 0;
  let waiting = 0;

  for (const flow of flows) {
    const candidates = await buildCandidates(flow.trigger_key, users);
    for (const candidate of candidates) {
      const targetUsers = candidate.userId ? users.filter((user) => user.id === candidate.userId) : users;
      for (const user of targetUsers) {
        const result = await processOne(flow, candidate, user);
        if (result === "sent") sent += 1;
        else if (result === "failed") failed += 1;
        else if (result === "canceled") canceled += 1;
        else if (result === "duplicate") duplicate += 1;
        else if (result === "waiting") waiting += 1;
      }
    }
  }

  return { checkedAt: new Date().toISOString(), flows: flows.length, sent, failed, canceled, duplicate, waiting };
}
