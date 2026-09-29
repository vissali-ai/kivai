# Etapa 3 — Separação do backend por responsabilidade

O arquivo `backend/main.py` passou a cuidar apenas da aplicação FastAPI, CORS,
saúde e registro das rotas. Os processamentos foram extraídos para `backend/api/`:

- `pdf.py`: inspeção e desbloqueio de PDF.
- `instagram.py`: resolução e transmissão da mídia.
- `html_pdf.py`: validação, sanitização e conversão de HTML.
- `background.py`: remoção de fundo e carregamento tardio do modelo.
- `video_compress.py`: inspeção e compressão.
- `video_mp4_mov.py`, `video_mp4_avi.py`, `video_mov_mp4.py`: conversões respectivas.
- `video_hevc.py`: conversões H.264/H.265.
- `video_common.py`: limites, metadados, uploads, FFmpeg e cancelamento compartilhados.

## Compatibilidade

Foram preservados os caminhos, parâmetros, validações, mensagens, limites,
headers, limpeza dos arquivos temporários e corpos das funções de processamento.
A comparação da árvore sintática confirmou que esses corpos não mudaram.
O auxiliar `detailed_video_metadata` continua disponível em `backend.main`.
O mock de Instagram agora aponta para o módulo responsável pelo endpoint.

Continuam suportados tanto `backend.main:app` a partir da raiz quanto
`uvicorn main:app` dentro de `backend`, conforme o Railway. Não houve mudança
na configuração de implantação, catálogo de ferramentas ou conteúdo público.

## Verificação

- Antes: 21 testes existentes aprovados.
- Depois: 26 testes aprovados, incluindo conversões com FFmpeg e PDFs com
  diferentes algoritmos de criptografia.
- Contrato OpenAPI das 18 rotas idêntico ao anterior. A referência está em
  `backend/tests/fixtures/openapi.json` e é verificada automaticamente.
- Testes adicionais de saúde/CORS, importação usada no Railway, carregamento
  tardio do modelo e rejeição de HTML/imagem inválidos.
- Referências globais dos módulos verificadas e `git diff --check` sem erros.

Executar na raiz, no Windows:

```powershell
& backend/.venv/Scripts/python.exe -m unittest discover -s backend/tests -v
```

O ambiente virtual local estava sem `imageio-ffmpeg` e `cryptography`; foram
instaladas as versões já fixadas em `requirements.txt`, sem alterar o manifesto.
O TestClient emite um aviso de depreciação sobre httpx; isso não impediu os testes.

Esta entrega valida a reorganização local do backend. Não foi feito deploy,
download/inferência do modelo BEN2, acesso real ao Instagram ou geração real
de HTML via Chromium. Os testes desses fluxos cobrem contrato e validação,
não uma execução completa em produção. Outros arquivos extensos do frontend
continuam fora deste recorte de refatoração.
