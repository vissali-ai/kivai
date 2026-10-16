import { test, expect, openTool, pdfFile, imageFile, download, expectNoOverflow } from './helpers';
import { Workbook } from 'exceljs';
test.beforeEach(async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('kivai_user_session',JSON.stringify({access_token:'test',user:{id:'test'}})));
 await page.route('**/api/account/**',r=>r.fulfill({json:{projects:[]}}));
 await page.route('**/api/ai/credits',r=>r.fulfill({json:{wallet:{plan_code:'free',free_limit:10,free_remaining:10,total_remaining:10,purchased_remaining:0,renews_on:'2026-11-01'},hourly:{limit:5,remaining:5},salesEnabled:true}}));
});
test('Counter and post preview apply only chosen captions; preview includes image but no profile',async({page})=>{
 for(const slug of ['contador-de-caracteres-instagram','preview-de-post-redes-sociais']){
  let calls=0;
  await page.route('**/api/ai/tool-assistant',async r=>{calls++;const body=r.request().postDataJSON();expect(body.kind).toBe('caption');expect(body).not.toHaveProperty('username');if(slug.startsWith('preview'))expect(body.image.mimeType).toBe('image/jpeg');await r.fulfill({json:{kind:'caption',variants:['Legenda revisada'],feedback:'Revise antes de usar.',alt:slug.startsWith('preview')?'Blocos de cores.':''}});});
  await openTool(page,slug);
  const text=slug.startsWith('preview')?page.getByLabel('Legenda',{exact:false}).first():page.getByPlaceholder('Digite sua legenda aqui…');
  await text.fill('Legenda original');
  if(slug.startsWith('preview'))await page.getByLabel('Imagem do post',{exact:true}).setInputFiles(await imageFile(page));
  const generate=page.getByRole('button',{name:/Gerar com IA/});await expect(generate).toBeDisabled();
  await page.getByLabel(/Autorizo enviar os dados/).check();await generate.click();
  await expect(page.getByRole('button',{name:'Usar legenda 1'})).toBeVisible();await expect(text).toHaveValue('Legenda original');
  await page.getByRole('button',{name:'Usar legenda 1'}).click();await expect(text).toHaveValue('Legenda revisada');expect(calls).toBe(1);
  await expectNoOverflow(page);await page.unroute('**/api/ai/tool-assistant');
 }
});
test('PDF assistants export reviewed structured data without executing content',async({page})=>{
 for(const [slug,format] of [['pdf-para-excel','xlsx'],['pdf-para-word','docx'],['pdf-para-html','html']]){
  await page.route('**/api/ai/tool-assistant',async r=>{const input=r.request().postDataJSON();expect(input.file.mimeType).toBe('application/pdf');expect(input.consent).toBe(true);await r.fulfill({json:format==='xlsx'?{kind:'table',tables:[{title:'Valores',rows:[['Código','Valor'],['001','=1+1']]}],warnings:[]}:{kind:'document',blocks:[{type:'heading',text:'Documento'},{type:'paragraph',text:'<script>alert(1)</script>'}],warnings:[]}});});
  await openTool(page,slug);await page.locator('input[type=file]').first().setInputFiles(await pdfFile());
  await page.getByLabel(/Autorizo enviar os dados/).check();await page.getByRole('button',{name:/Gerar com IA/}).click();
  const button=page.getByRole('button',{name:`Baixar ${format.toUpperCase()} revisado`});await expect(button).toBeDisabled();
  await page.getByLabel(/Conferi o conteúdo com o PDF original/).check();const result=await download(page,button);expect(result.name).toMatch(new RegExp(`\\.${format}$`));
  if(format==='html')expect(result.bytes.toString()).toContain('&lt;script&gt;');
  if(format==='xlsx'){const book=new Workbook();await book.xlsx.load(result.bytes as never);expect(book.worksheets[0].getCell('A2').value).toBe('001');expect(book.worksheets[0].getCell('B2').value).toBe('=1+1');}
  await expectNoOverflow(page);await page.unroute('**/api/ai/tool-assistant');
 }
});
test('Rename applies suggestions only to the preview and allows returning to manual names',async({page})=>{
 await page.route('**/api/ai/tool-assistant',async r=>{expect(r.request().postDataJSON().names).toEqual(['original.txt']);await r.fulfill({json:{kind:'rename',names:['organizado-01.txt']}});});
 await openTool(page,'renomear-arquivos-em-lote');await page.locator('input[type=file]').first().setInputFiles({name:'original.txt',mimeType:'text/plain',buffer:Buffer.from('Conteúdo preservado')});
 await page.getByLabel(/Autorizo enviar os dados/).check();await page.getByRole('button',{name:/Gerar com IA/}).click();await page.getByRole('button',{name:'Aplicar nomes à prévia'}).click();
 const result=await download(page,page.getByRole('button',{name:'Baixar arquivos renomeados',exact:true}));
 const {default:JSZip}=await import('jszip');const zip=await JSZip.loadAsync(result.bytes);expect(await zip.file('organizado-01.txt')?.async('string')).toBe('Conteúdo preservado');
 await page.getByRole('button',{name:'Voltar à numeração manual'}).click();await expect(page.getByText('arquivo-01.txt',{exact:true})).toBeVisible();
});
test('Radar ideas retain source and use only available excerpt',async({page})=>{
 const item={title:'Notícia de teste',sourceName:'Fonte de teste',url:'https://example.com/noticia',excerpt:'Trecho disponível.',publishedAt:'2026-10-15T12:00:00Z',window:'today',coverageCount:1,score:1};
 await page.route('**/api/news-radar',r=>r.fulfill({json:{category:'marketing',categoryLabel:'Marketing',items:[item],collectedAt:item.publishedAt,expiresAt:item.publishedAt,sourcesChecked:1,sourcesSucceeded:1,partial:false,fromCache:true,stale:false}}));
 await page.route('**/api/ai/tool-assistant',async r=>{expect(r.request().postDataJSON().excerpt).toBe(item.excerpt);await r.fulfill({json:{kind:'news',ideas:[{title:'Pauta sugerida',angle:'Explique o tema ao seu público.'}],caveat:'Baseado apenas no trecho disponível.'}});});
 await openTool(page,'radar-de-tendencias');await page.getByRole('button',{name:/Buscar notícias/}).click();
 await page.getByLabel('Seu segmento e público').fill('Cafeterias');await page.getByLabel(/Autorizo enviar os dados/).check();await page.getByRole('button',{name:/Gerar com IA/}).click();
 await expect(page.getByText('Pauta sugerida',{exact:true})).toBeVisible();await expect(page.getByRole('link',{name:/Fonte: Fonte de teste/})).toHaveAttribute('href',item.url);await expectNoOverflow(page);
});
