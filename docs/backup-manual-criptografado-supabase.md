# Backup manual criptografado do Supabase Kivai

## Objetivo e limites
Workflow manual (Actions > Kivai - backup manual criptografado do Supabase > Run workflow > main). Usa um runner temporário do GitHub, PostgreSQL 17 em contêiner remoto e exporta somente um artefato criptografado (GPG AES256).

**Não instala nada no computador do operador; não executa SQL de escrita, migrações, restaurações ou mudanças de produção.** Não habilita o webhook Asaas e não modifica InfinitePay.

## Preparação exclusiva no GitHub (nunca compartilhar valores no chat)
Repositório `vissali-ai/kivai` > Settings > Secrets and variables > Actions > New repository secret:

- `KIVAI_BACKUP_DB_URL`: copiar no Supabase do projeto Kivai Blog > Connect > Session pooler > URI na porta 5432, substituir [YOUR-PASSWORD] pela senha atual do banco codificando caracteres reservados. Nunca utilizar a URI em issue, PR, logs, mensagens ou arquivos versionados. Não utilizar Transaction pooler (6543). Preferir a conexão direta IPv6 quando o runner suportar, mas Session pooler serve em ambiente IPv4.
- `KIVAI_BACKUP_PASSPHRASE`: frase aleatória e forte com **pelo menos 32 caracteres**, criada e guardada num gerenciador de senhas em local externo ao GitHub. Sem essa frase, não será possível abrir o backup.

A execução começa somente quando acionada manualmente na branch main. Nenhum secret fica no arquivo YAML. Não salvar a senha de acesso do banco em `.env` no GitHub ou na Vercel.

## Conferir resultado
Abra Actions > execução do workflow. Deve concluir com sucesso a exportação, listagem do formato do dump e criptografia/verificação do arquivo. Em Artifacts, baixe `kivai-supabase-backup-criptografado` no mesmo dia: a retenção foi limitada a **1 dia**. Guarde o arquivo `.dump.gpg` fora do GitHub em armazenamento seguro, junto do arquivo SHA256, mas **separado** da senha de criptografia.

O backup lógico `pg_dump` contém estruturas e dados que a conta conectada pode exportar; não constitui um backup integral da plataforma: **não inclui arquivos binários do Storage, configurações de Auth/infra externas, nem roles globais**. A verificação `pg_restore --list` não substitui um teste efetivo de restauração em banco descartável. Antes de qualquer migração SQL em produção, testar restauração quando houver ambiente de testes disponível.

## Cuidados
- O dump pode conter dados pessoais e financeiros. Não publicar nem enviar esse arquivo em conversas.
- O backup é processado temporariamente no runner do GitHub; para requisitos mais rigorosos de confidencialidade, utilizar executor próprio controlado.
- Se o backup falhar, não aplicar migrações Asaas. Conferir versão do PostgreSQL, conexão e permissões sem imprimir a URI.
- Se houver volumes ou recursos sujeitos a quotas, conferir consumo e tamanho do artefato no GitHub.
