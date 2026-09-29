# Etapa 1 — auditoria funcional de dez ferramentas

Data: 27/09/2026.

## Escopo e seleção

Seleção por representatividade técnica, sem dados de tráfego: quatro ferramentas de imagem, quatro de PDF, uma de texto e uma de QR Code. São fluxos que processam dados no navegador e permitem conferir o resultado sem enviar arquivos pessoais a serviços externos.

Os testes abrem as rotas reais, interagem com os controles e conferem os downloads. Imagens e PDFs sintéticos são gerados durante a execução. Não há simulação do motor de conversão, de PDF ou de QR Code.

## Cobertura automatizada

| Ferramenta | O que é conferido |
| --- | --- |
| Conversor de imagens | Formato inválido, arquivo vazio, limite de 5 MB, imagem corrompida, recuperação após erro, JPEG/WebP, dimensões, prévia e troca de arquivo sem resultado antigo. |
| Compressor de imagens | Formato inválido, arquivo vazio, limite de 5 MB, download PNG sem aumento de tamanho, preservação das dimensões e validade da prévia original. |
| Redimensionar imagem | Formato inválido, limite de 20 MB, dimensão zero, proporção preservada e dimensões do PNG baixado. |
| Recortar imagem | Formato inválido, ajuste numérico do recorte e dimensões do PNG baixado. |
| Unir PDFs | Rejeição de formato inválido, reordenação de documentos e ordem das páginas no PDF final. |
| Dividir PDF | Rejeição de PDF corrompido, recuperação e ZIP com um PDF válido por página, preservando a ordem. |
| Girar PDF | Formato inválido e rotação relativa em documento com páginas inicialmente em 0°, 90° e 270°. |
| Imagens para PDF | Formato inválido, duas imagens gerando duas páginas A4 no arquivo baixado. |
| Contador de palavras | Texto em português, palavras, frases, parágrafos, linhas, limite personalizado e limpeza. |
| Gerador de QR Code | Entrada vazia, download PNG, decodificação independente da URL com `jsqr`, exportação SVG e limpeza. |

Todos os fluxos verificam ausência de erros JavaScript não tratados. As dez ferramentas também têm verificação de transbordamento horizontal após uso. A suíte tem 11 cenários, executados em Chromium desktop e Pixel 7 emulado: 22 execuções.

## Resultado da validação

- **22/22 testes aprovados** no servidor de desenvolvimento e, após o build, no servidor local de produção. A execução final no build levou 34,8 segundos.
- `npm run build`: aprovado, incluindo compilação, TypeScript e geração de 157 páginas.
- `npx tsc --noEmit --incremental false`: aprovado.
- ESLint dos arquivos de implementação e testes alterados: zero erros; quatro avisos de `no-img-element` nas prévias locais já existentes.
- `npm run audit:tools`: 73 ferramentas, 73 rotas e 73 URLs indexáveis coerentes.
- Captura do QR Code em tela móvel inspecionada. Os downloads também foram conferidos por conteúdo, sem depender apenas da aparência.

Durante a execução em desenvolvimento, o ambiente restrito não conseguiu baixar fontes do Google e utilizou fontes de fallback. O build com acesso à rede concluiu normalmente. Nenhuma alteração foi publicada em produção.

## Falhas reproduzidas e corrigidas

1. **Girar PDF substituía a orientação anterior.** Um documento com páginas em 0°, 90° e 270°, ao girar 90°, terminava com todas em 90°. O resultado agora é 90°, 180° e 0°.
2. **Conversor mantinha o resultado do arquivo anterior.** Ao selecionar outra imagem depois de converter, o botão de download continuava oferecendo o resultado antigo. A seleção de um novo arquivo agora invalida o resultado.
3. **Prévia original era liberada ao gerar o resultado.** Conversor e compressor usavam um único efeito para limpar duas URLs independentes. A mudança no resultado revogava também a URL da imagem original. Cada URL agora tem sua própria limpeza.

Também foi adicionada rejeição imediata de arquivo vazio no compressor, uma mensagem em português para falha de leitura no conversor e bloqueio de seleção durante processamento nesses dois componentes. Os inputs são limpos após seleção para permitir escolher novamente o mesmo arquivo.

## Executar

```powershell
npm ci
npx playwright install chromium
npm run test:tools
```

O Playwright inicia o servidor local na porta 3100. Para esse servidor, desativa anúncios e deixa o CMS sem conexão, usando o conteúdo de fallback existente. Um servidor já ativo nessa porta é reutilizado localmente; nesse caso, valem as configurações desse servidor. As dependências adicionadas são somente de desenvolvimento.

Somente computador:

```powershell
npm run test:tools:desktop
```

Para testar um servidor local já preparado, inclusive o build de produção:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3100'
npm run test:tools
Remove-Item Env:PLAYWRIGHT_BASE_URL
```

Relatório HTML: `npx playwright show-report`. Capturas e traces de falhas ficam em `test-results/`; ambos os diretórios de resultados são ignorados pelo Git.

## Limites desta entrega

- A emulação móvel não substitui testes em aparelhos físicos, Safari/iOS, Firefox ou seletores nativos de arquivos.
- Os PDFs e imagens de teste são pequenos e sintéticos. Limites de tamanho foram conferidos onde já existem (5 MB e 20 MB); não houve teste de carga nem de documentos grandes, protegidos por senha ou com todas as estruturas possíveis.
- A verificação de recorte usa medidas numéricas; não cobre todos os gestos de arrastar e redimensionar.
- O compressor foi exercitado com PNG; o QR Code foi decodificado no modo URL padrão, sem logos ou modelos personalizados.
- Não foram auditadas nesta etapa as demais 63 ferramentas, serviços externos, backend Python, autenticação, pagamentos ou a edição completa pelo Admin.
- Nenhuma ferramenta ou conteúdo público foi criado. As correções mantêm os registros existentes no catálogo/CMS.
