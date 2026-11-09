import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = path.resolve(new URL("../../", import.meta.url).pathname);
function filesIn(dir) {
  const result = [];
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...filesIn(full));
    else if (/\.(ts|tsx)$/.test(entry.name)) result.push(full);
  }
  return result;
}

test("application has no SumUp imports, SDK, API routes or active gateway implementation", () => {
  const files = ["app", "components", "lib"].flatMap(p => filesIn(path.join(root,p)));
  assert.ok(files.length > 100);
  for (const file of files) {
    const source = fs.readFileSync(file,"utf8");
    assert.equal(source.includes("@/lib/billing/sumup"),false,file);
    assert.equal(source.includes("gateway.sumup.com"),false,file);
    assert.equal(source.includes("api.sumup.com"),false,file);
    assert.equal(source.includes("/api/billing/sumup"),false,file);
    assert.equal(source.includes("SUMUP_API_KEY"),false,file);
    assert.equal(source.includes("SUMUP_MERCHANT_CODE"),false,file);
  }
  assert.equal(fs.existsSync(path.join(root,"lib/billing/sumup.ts")),false);
});

test("existing checkout path cannot charge a card and redirects to current plans", () => {
  const file = fs.readFileSync(path.join(root,"app/conta/checkout/page.tsx"),"utf8");
  assert.ok(file.includes('redirect("/planos")'));
  assert.equal(file.includes("CheckoutClient"),false);
});

test("independent authentication preserves authentication and rejects forged sessions", async () => {
  const src = fs.readFileSync(path.join(root,"lib/auth/authenticated-billing-user.ts"),"utf8");
  const js = ts.transpileModule(src, {compilerOptions: {module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const mockModule={exports:{}};
  new Function("require","module","exports",js)(name=>{
    if(name==="server-only") return {};
    assert.equal(name,"@/lib/blog/config");
    return {blogConfig:{supabaseUrl:"https://project.supabase.co",serviceRoleKey:"test_service_role"}};
  },mockModule,mockModule.exports);
  const authenticate=mockModule.exports.authenticateBillingUser;
  await assert.rejects(()=>authenticate(new Request("https://example.test")),/UNAUTHORIZED/);
  const original=global.fetch;
  try {
    global.fetch=async (url, options) => {
      assert.equal(url,"https://project.supabase.co/auth/v1/user");
      assert.equal(options.headers.Authorization,"Bearer valid-user-token");
      return Response.json({id:"11111111-1111-4111-8111-111111111111",email:"member@example.test"});
    };
    const user=await authenticate(new Request("https://example.test",{
      headers:{authorization:"Bearer valid-user-token"}
    }));
    assert.equal(user.id,"11111111-1111-4111-8111-111111111111");
  } finally {
    global.fetch=original;
  }
});
