import {test} from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const plans=fs.readFileSync(new URL("../../components/account/plans-client.tsx",import.meta.url),"utf8");
const route=fs.readFileSync(new URL("../../app/api/billing/asaas/production-checkout/route.ts",import.meta.url),"utf8");

test("Asaas recurring checkout has a runtime server readiness gate, never a client secret",()=>{
  assert.match(plans,/fetch\("\/api\/billing\/asaas\/production-checkout", \{ cache: "no-store"/);
  assert.match(plans,/setAsaasEnabled\(config\?\.enabled === true\)/);
  assert.match(route,/return Response\.json\(\{ enabled: checkoutReady\(\) \}/);
  assert.match(route,/KIVAI_ASAAS_VERIFIED_AUTO_LINK/);
  assert.doesNotMatch(plans,/ASAAS_API_KEY|ASAAS_WEBHOOK_TOKEN|NEXT_PUBLIC_KIVAI_ASAAS/);
});
test("Existing payment request is kept and only free users can be routed to Asaas",()=>{
  assert.match(plans,/const useAsaas = asaasEnabled && currentPlan === "free"/);
  assert.match(plans,/"\/api\/account\/subscription-request"/);
  assert.match(plans,/window\.open\(data\.paymentLink/);
  assert.match(plans,/window\.location\.assign\(data\.checkoutUrl\)/);
  assert.doesNotMatch(plans,/window\.location\.assign\(data\.paymentLink\)/);
});
