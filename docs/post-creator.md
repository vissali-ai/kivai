# Criador de Posts com IA

Rota: `/ferramentas/criador-de-posts-com-ia`. Cadastro do Admin: `existing:criador-de-posts-com-ia` (catálogo central; alterações editoriais persistem no CMS).

O conteúdo usa a integração Gemini existente: 1 crédito. Imagem usa `gemini-3.1-flash-lite-image`, uma imagem 1K por solicitação: 5 créditos. Os valores dos planos e suas franquias permanecem iguais. Edição manual, PNG, JSON e Preview não gastam créditos. Falhas após reserva devolvem os créditos. As cotas por hora existentes também se aplicam.

## Ativação de imagens pelo responsável

1. Habilitar faturamento no projeto Google associado à `GEMINI_API_KEY` já usada pelo site e verificar acesso ao modelo de imagem no AI Studio.
2. No projeto Kivai da Vercel, adicionar `GEMINI_IMAGE_GENERATION_ENABLED=true` no ambiente Production.
3. Fazer um novo deployment. A chave permanece apenas no servidor.
4. Fazer uma geração de teste, conferir a imagem e o débito de 5 créditos. Falhas devem devolver a reserva.

Sem essa variável, a geração de imagens fica indisponível tanto na interface quanto no servidor, sem reserva ou cobrança. Para desativar, remover a variável ou definir `false` e publicar novamente. A configuração não habilita faturamento no Google automaticamente.

## Projetos e privacidade

Projetos `post_creator` usam a biblioteca e os limites de projetos existentes. Imagens próprias são otimizadas no navegador e não são enviadas à IA. Salvar na conta armazena a versão otimizada no banco. A transferência ao Preview fica na sessão da mesma aba por até dez minutos e exige aplicação explícita, preservando os dados do perfil.

Aplicar a migração `20261019230000_post_creator.sql` antes do deployment: permite o novo tipo de projeto e o custo de 5 créditos, preservando a implementação e as permissões da função existente.
