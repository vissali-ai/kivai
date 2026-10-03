# Imprimir Frente e Verso

Rota canônica: `/ferramentas/imprimir-frente-e-verso`. A rota `/pdf/imprimir-frente-e-verso` redireciona permanentemente para ela, mantendo a convenção do catálogo e do CMS.

## Administração

Admin → Site → Imprimir Frente e Verso. A entrada virtual do catálogo existe imediatamente, antes da primeira gravação. O editor permite alterar conteúdo, SEO, publicação, indexação, sitemap, hub e modelos. O catálogo de impressoras é persistido em `customData.printers`, usando a API autenticada já existente; não exige migração. A validação no servidor impede IDs repetidos e instruções confirmadas sem fonte e campos obrigatórios. Rascunhos e itens arquivados não exibem a ferramenta.

Cada impressora tem ID independente para futuras rotas, marca, modelo, capacidade duplex (sim/não/desconhecida), estado das instruções, fonte, bandeja, saída, primeira passagem, reinserção, borda, observações e URL de tutorial. A capacidade duplex pode ser verificada sem que as instruções físicas estejam confirmadas. Os dados iniciais ficam em `lib/duplex-print/catalog.ts`; as edições salvas substituem esse conjunto, inclusive quando a lista é esvaziada.

## Fluxo e limites

PDFs são processados localmente com carregamento sob demanda de pdf-lib. Limites: 50 MB e 500 páginas. Arquivos protegidos não são desbloqueados. O modo manual exige páginas com dimensões e orientação visual uniformes.

O teste de uma folha valida a posição registrada pelo usuário. Erros exigem repetir o teste em folha nova. O teste de duas folhas verifica a ordem da pilha. A ferramenta não observa a impressora: a exatidão depende das respostas e da repetição do mesmo movimento. A borda é validada fisicamente pelo teste; mudar borda, modelo, arquivo ou posição invalida os resultados anteriores.

Frentes: páginas originais 1, 3, 5... Versos: 2, 4, 6..., eventualmente invertidos após o teste da pilha. Documento ímpar recebe um verso em branco na posição correspondente. Imprimir uma cópia, uma página por folha, sem duplex, filtros de pares/ímpares, ordem inversa ou supressão de páginas em branco no leitor. O modo automático baixa o original e orienta a configurar o driver. A ferramenta não envia comandos para a impressora.

## Verificação

- `node --test tests/duplex/pdf.test.mjs tests/cms/catalog.test.mjs`
- `npx playwright test tests/tools/duplex-print.spec.ts`
- `npx tsc --noEmit`
- ESLint nos arquivos novos.

Os testes do CMS substituem apenas o transporte de dados remoto e usam os handlers reais. Os testes de navegador usam banco desabilitado, cobrem desktop e mobile, os downloads e o reset da calibração. Não validam uma impressora física nem publicam o site. As instruções confirmadas da Brother MFC-490CW vêm da FAQ oficial; os demais modelos usam calibração para reinserção.
