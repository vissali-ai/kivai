# Revisão conservadora de qualidade — 02/11/2026

Base avaliada: produção `3992ee2dd4b3936b150e4581eaf5652f75b15edf`.

## Critério e limites

Nota inicial editorial/técnica: 8,5/10. Uma nota de avaliação não equivale a garantia de ausência de falhas. A revisão preserva textos públicos, metadados SEO, URLs, catálogo/CMS, regras de planos, autenticação, processadores das ferramentas e anúncios. Nenhum conteúdo público novo foi criado.

## Evidências da versão anterior

- Auditoria pública: 220 URLs do sitemap e 444 links internos únicos aprovados; títulos, canonical, H1 e indexação verificados pelo script existente.
- Lighthouse mobile, uma execução de laboratório na página inicial: desempenho 83, acessibilidade 91, boas práticas 77, SEO 100. Pontuações variam com rede, máquina e terceiros; não são dados reais de Core Web Vitals.
- Parte do tempo de execução JavaScript e os alertas de cookies de terceiros vieram do AdSense. Não se alterou a monetização para aumentar artificialmente a nota.
- Lint global: 40 erros e 31 avisos preexistentes; esta entrega não declara o projeto inteiro livre de pendências nem refatora fluxos funcionando apenas para eliminar alertas.

## Ajustes

- Busca: sem referências ARIA a elementos inexistentes quando fechada; combobox com estado expandido e opção ativa; resultados nomeados; mensagem existente sem resultados anunciada como status.
- Contraste: escurecimento pontual de três cores de categorias e de uma nota dos planos, mantendo todas as palavras e estrutura visual.
- Rodapé: o nome acessível do Instagram inclui o identificador já visível. Texto exibido e destino inalterados.
- Testes: cobertura da navegação por teclado e dos estados da busca; teste antigo de upload alinhado à remoção intencional do aviso de processamento local, sem recolocá-lo no site. Seletores consideram somente a página visível, pois Next mantém outras páginas no DOM.

## Validação

- Oito páginas em desktop e Pixel 7: HTTP 200, sem erros JavaScript ou transbordamento horizontal; falhas automáticas de acessibilidade inicialmente encontradas foram eliminadas na versão local.
- WCAG 2 A/AA e 2.1 A/AA na busca fechada, com resultados e sem resultados: nenhuma violação detectada no teste local final, incluindo o rodapé.
- 24 testes funcionais passaram para calculadoras de marketing, imagens, PDF, texto e QR. Os dois testes de seleção por teclado inicialmente incompatíveis com a versão atual passaram após atualização das expectativas. Quatro testes novos de busca passaram em desktop/mobile.
- Lint dos arquivos alterados validado sem desabilitar regras globais. Build de produção verificado antes da publicação.
- Não foram enviados formulários reais, e-mails, cobranças ou alterações ao banco. As verificações de acessibilidade são automáticas, complementadas por inspeção visual da página inicial em desktop/mobile; não substituem uma auditoria manual completa de todas as ferramentas.

Resultados de publicação e métricas posteriores devem ser confirmados pelo deployment exato e pelo domínio público, sem confundir sucesso do build com validação integral de integrações externas.
