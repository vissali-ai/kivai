import { test, expect, openTool } from './helpers';

test('Updated AI analysis remains insertable and preserves manual notes with real line breaks', async ({page})=>{
 await page.addInitScript(()=>localStorage.setItem('kivai_user_session',JSON.stringify({access_token:'test',user:{id:'test'}})));
 await page.route('**/api/account/**',r=>r.fulfill({json:{projects:[]}}));
 await page.route('**/api/ai/credits',r=>r.fulfill({json:{wallet:{plan_code:'free',free_limit:10,free_remaining:10,total_remaining:10,purchased_remaining:0,renews_on:'2026-11-01'},hourly:{limit:5,remaining:5},salesEnabled:true}}));
 let calls=0;
 await page.route('**/api/ai/social-report',async r=>{calls++;await r.fulfill({json:{analysis:{summary:`Análise ${calls} dos indicadores informados.`,strengths:['Indicadores disponíveis.'],attention:[],actions:['Revisar no próximo período.']}}});});
 await openTool(page,'gerador-de-relatorio-social-media');
 await page.getByRole('button',{name:'2 Métricas',exact:true}).click();
 await page.getByLabel('Alcance',{exact:true}).fill('100');
 await page.evaluate(()=>{const key='kivai:relatorio-social-media:draft:v1';const draft=JSON.parse(localStorage.getItem(key)!);draft.notes='Minha observação manual';draft.nextSteps='Minha ação manual';localStorage.setItem(key,JSON.stringify(draft));});
 await page.reload();
 await page.getByRole('button',{name:'5 Relatório',exact:true}).click();
 await page.getByRole('button',{name:'Analisar com IA · 1 crédito',exact:true}).click();
 await page.getByRole('button',{name:'Inserir diagnóstico e plano no relatório',exact:true}).click();
 await expect(page.getByRole('button',{name:'Adicionado ao relatório',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Atualizar análise · 1 crédito',exact:true}).click();
 await page.getByRole('button',{name:'Inserir diagnóstico e plano no relatório',exact:true}).click();
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('kivai:relatorio-social-media:draft:v1')!));
 expect(draft.notes).toContain('Minha observação manual\n\nAnálise com IA');
 expect(draft.notes).toContain('Análise 2 dos indicadores');
 expect(draft.notes).not.toContain('\\n');
 expect(draft.nextSteps).toContain('Minha ação manual\nPlano de ação');
 expect(calls).toBe(2);
});
