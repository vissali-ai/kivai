# Etapa 3 — Gerador de QR Code

O gerador concentrava 1.337 linhas em um componente. A refatoração separou:

- `gerador-de-qr-code-client.tsx`: composição da página, controles visuais e prévia.
- `use-qr-code.ts`: estado, geração assíncrona, upload da logo, cópia e downloads.
- `qr-content-fields.tsx`: campos específicos de cada tipo de conteúdo.
- `qr-content.ts`: normalização de URLs, números brasileiros e escape de Wi-Fi.
- `qr-artwork.ts`: composição SVG dos cinco modelos visuais e escape de texto.
- `qr-config.ts`: tipos e opções existentes da ferramenta.

Os campos permanecem controlados pelo mesmo estado, preservando os dados ao
alternar tipos. A biblioteca de geração continua carregada sob demanda, e a
proteção contra resultados assíncronos obsoletos foi mantida. A fronteira
cliente do Next.js permanece no componente principal. Não foram adicionados
conteúdos públicos, modelos ou rotas; o cadastro existente no Admin não muda.

## Verificação

Resultado: TypeScript e build de produção aprovados; ESLint sem erros, com um
aviso preexistente sobre `<img>` na prévia. Os quatro novos testes (dois cenários
em desktop e celular) passaram. Os quatro casos anteriores de contador/QR
também passaram durante a verificação. O componente principal ficou com 562
linhas, contra 1.337 antes da separação.

Os testes de navegador incluem download e leitura dos pixels do PNG com jsQR,
comparando o conteúdo efetivamente codificado. Cobrem URL, texto, WhatsApp,
telefone, e-mail, Wi-Fi com/sem senha, preservação de estado ao alternar tipos,
os cinco modelos visuais e exportação SVG. A suíte anterior também verifica
entrada vazia e a normalização automática do protocolo da URL.

Comandos de verificação:

```powershell
npx tsc --noEmit
npx eslint app/ferramentas/gerador-de-qr-code tests/tools/qr-variants.spec.ts
npx playwright test tests/tools/text-qr.spec.ts tests/tools/qr-variants.spec.ts
npm run build
```

Esta é uma refatoração local. Não inclui deploy nem uma revisão integral dos
demais componentes do frontend. Os testes usam Chromium em desktop e emulação
de celular, não dispositivos físicos.
