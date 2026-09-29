# Etapa 2 — experiência consistente nas dez ferramentas prioritárias

## Escopo

Aplicado às mesmas dez ferramentas da [etapa 1](auditoria-ferramentas-etapa-1.md): conversor e compressor de imagens, redimensionar e recortar imagem, unir, dividir e girar PDF, imagens para PDF, contador de palavras e QR Code.

## Padrão aplicado

- **Antes da seleção:** informar formatos, limites já implementados e processamento local. Não inventar um limite para ferramentas que ainda não o possuem.
- **Seleção:** `ToolUploadArea` fornece botão nativo acessível por teclado, seleção pelo dispositivo e arrastar/soltar. Permite selecionar novamente o mesmo arquivo e respeita seleção única/múltipla. O modo compacto mantém a opção de trocar ou adicionar arquivos sem repetir uma área grande.
- **Processamento:** `ToolProcessingStatus` apresenta a operação atual. Entradas e opções ficam indisponíveis enquanto uma operação assíncrona usa os arquivos.
- **Erro:** `ToolErrorMessage` anuncia a falha e orienta a recuperação. O contador agora explica falhas de permissão para copiar/colar; o recorte captura falhas ao gerar a imagem.
- **Resultado:** as oito ferramentas de arquivos usam `ToolResultCard`, com detalhes, download e recomeço. PDFs agora são preparados primeiro e baixados por uma ação explícita.
- **Download de PDF/ZIP:** `ToolDownloadResult` mantém o resultado em memória para baixar novamente, informa nome/tamanho e permite começar novamente. Alterar os arquivos, a ordem ou o ângulo invalida o resultado anterior.
- **Texto e QR Code:** continuam com atualização automática; não recebem um botão artificial de processamento. O QR Code usa o indicador de processamento comum e ambos explicitam o processamento no navegador.

## Correções associadas

- O ZIP do redimensionador preserva duas imagens com o mesmo nome, acrescentando a posição ao nome de cada entrada. Anteriormente uma entrada podia substituir a outra.
- O redimensionador trata falhas na preparação do ZIP e oferece a alternativa de baixar individualmente.
- O recorte mostra erro recuperável quando o navegador não consegue gerar a imagem, em vez de deixar uma rejeição sem tratamento.
- As regras CSS antigas de upload não se aplicam ao novo componente, evitando ícones/botões duplicados e estilos que ocultem seus estados.
- As URLs temporárias para download de PDFs/ZIPs usam o helper existente que aguarda antes de liberar o recurso.

## Reutilização e CMS

Os motores de cada ferramenta continuam separados. Foram reutilizados componentes de interface, sem transformar todas as operações em uma implementação genérica.

Ferramentas fora deste grupo que já utilizavam `ToolUploadArea` também recebem o botão acessível e a correção de seleção. Seus motores não fazem parte desta auditoria. O modo de processamento é uma propriedade explícita; não se presume processamento local para ferramentas de servidor.

Não foram criadas ferramentas, rotas ou conteúdo editorial público. Os registros existentes no catálogo/CMS, SEO e controles editoriais permanecem responsáveis pelo conteúdo das ferramentas.

## Verificação

Resultado final: **32/32 execuções aprovadas** no build de produção local (16 cenários em computador e celular emulado). Build, TypeScript e auditoria das 73 ferramentas aprovados. ESLint dos arquivos alterados: zero erros, nove avisos sobre prévias com `<img>`. Seleção e resultado foram inspecionados visualmente em tela móvel; o seletor de DOCX, que já usava o componente compartilhado, também foi conferido quanto ao transbordamento horizontal.

`npm run test:tools` executa a suíte em Chromium desktop e Pixel 7 emulado. Além dos testes de arquivos/resultados da etapa 1, os novos cenários cobrem:

1. Abertura do seletor por teclado e informações antes da seleção nas oito ferramentas de arquivos.
2. Resultado de PDF sem download automático, download repetido, invalidação ao alterar opções e recomeço.
3. Erros de permissão para copiar/colar e recuperação ao editar.
4. Falha na geração do recorte e nova tentativa bem-sucedida.
5. ZIP com nomes repetidos e recomeço do redimensionador.

A emulação não substitui aparelhos físicos ou testes no Safari/iOS. A suíte cobre os cenários descritos, não todos os formatos ou as outras ferramentas do catálogo. Nenhuma alteração foi publicada por esta etapa.
