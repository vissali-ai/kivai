# Padrão Oficial de Página de Ferramenta Kivai v1

Este documento define a estrutura mínima recomendada para páginas de ferramentas do Kivai. O objetivo é manter consistência de UX, SEO, privacidade, conteúdo editorial e monetização sem transformar todas as ferramentas em páginas idênticas.

## Princípios

- A ferramenta funcional vem antes da publicidade e do conteúdo editorial.
- Cada página deve explicar o problema específico que resolve.
- Conteúdo não deve ser duplicado entre ferramentas apenas para preencher espaço.
- Limitações, formatos e comportamento técnico devem refletir a implementação real.
- Processamento local, uso de servidor e integrações externas devem ser informados corretamente.
- A página deve ser útil mesmo sem anúncios.
- O layout deve permanecer responsivo e acessível em desktop e mobile.

## Estrutura recomendada

1. Breadcrumb visual.
2. Categoria, H1 e descrição objetiva.
3. Informação de confiança/processamento quando relevante.
4. Área funcional da ferramenta.
5. Benefícios ou sinais de confiança específicos da ferramenta.
6. Placement publicitário lógico `tool-inline`, quando aplicável.
7. Sobre esta ferramenta.
8. Como usar.
9. Quando utilizar.
10. Formatos, controles, fórmulas ou especificações conforme o tipo de ferramenta.
11. Privacidade e processamento.
12. Limitações importantes.
13. FAQ visível e específico.
14. Placement publicitário lógico `tool-bottom`, quando aplicável.
15. Ferramentas relacionadas.
16. Conteúdos relacionados, quando existirem artigos realmente pertinentes.
17. Footer institucional global.

## Componentes reutilizáveis

- `components/tools/tool-page-breadcrumb.tsx`: breadcrumb visual das ferramentas.
- `components/tools/tool-editorial-layout.tsx`: estrutura editorial compartilhada.
- `lib/tool-page-schema.ts`: builder de JSON-LD para SoftwareApplication, BreadcrumbList e FAQPage.
- `components/ads/AdSlot.tsx`: definição desacoplada de placements publicitários.

A lógica funcional da ferramenta deve continuar específica, por exemplo:

- `RemovedorDeMetadadosClient`
- `CompressorDeImagensClient`
- `ConversorDeImagensClient`

Não criar um único componente funcional genérico para tarefas tecnicamente diferentes.

## SEO obrigatório

Cada ferramenta indexável deve possuir:

- URL estável e descritiva;
- H1 único;
- title próprio;
- meta description própria;
- canonical correto;
- hierarquia coerente de H2/H3;
- links internos úteis;
- breadcrumb visual alinhado ao `BreadcrumbList`;
- dados estruturados somente quando correspondem ao conteúdo real da página;
- inclusão no sitemap apenas quando a página estiver funcional e editorialmente revisada.

## Conteúdo editorial

O conteúdo deve ser específico para a intenção da ferramenta. Não existe meta de quantidade de palavras.

Exemplos:

- Conversores devem explicar formatos, compatibilidade e possíveis alterações no arquivo.
- Calculadoras devem explicar fórmula, entradas, interpretação e limitações.
- Ferramentas de arquivo devem explicar formatos, limites e processamento.
- Ferramentas de privacidade devem explicar claramente o que é e o que não é removido ou protegido.

## Privacidade

Nunca usar afirmações genéricas como "100% privado" sem base técnica.

- Se o processamento for local, informar que ocorre no navegador.
- Se houver envio ao servidor, informar essa condição.
- Se houver API ou serviço externo, a documentação e a página devem refletir isso.
- Não prometer exclusão em prazo específico se essa política não existir tecnicamente.

## Publicidade

Usar placements lógicos em vez de tamanhos ou IDs específicos do provedor.

Placements padrão para ferramentas:

- `tool-inline`: após a área funcional e sinais de confiança, nunca entre controles críticos.
- `tool-bottom`: depois do conteúdo principal/FAQ e antes dos relacionados.

Evitar anúncios entre upload, processamento e download. O `AdSlot` não deve obrigar a página a conhecer detalhes do AdSense, Ad Manager, afiliados ou campanhas internas.

## Mobile e acessibilidade

- Controles principais devem ter área de toque confortável.
- Botões críticos podem ocupar largura total em telas pequenas.
- Upload por arquivo deve permanecer acessível por teclado e leitor de tela.
- Mensagens de erro devem usar `role="alert"` quando apropriado.
- Estados de processamento e resultado devem usar `aria-live`/`role="status"` quando úteis.
- Breadcrumb não deve quebrar o layout em telas estreitas.

## Checklist antes de indexar

- Ferramenta executa a tarefa principal sem erro conhecido.
- Estados vazio, carregando, sucesso e erro estão tratados.
- Limites e formatos estão claros.
- Conteúdo editorial é próprio e útil.
- Privacidade corresponde ao funcionamento real.
- Metadata e canonical estão corretos.
- Breadcrumb visual e Schema estão alinhados.
- FAQ visível corresponde ao Schema, se houver.
- Links relacionados não estão quebrados.
- Placements não interferem nas ações principais.
- Página funciona em mobile e desktop.
- Build do projeto passa sem erro.

## Ferramenta de referência

A implementação de referência deste padrão é:

`/ferramentas/removedor-de-metadados`

Alterações futuras no padrão devem ser testadas primeiro em uma ferramenta-modelo antes de serem replicadas em lote.
