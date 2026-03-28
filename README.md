# Chatpublico

Projeto base completo para um chat público e anônimo com grupos protegidos por senha, mídia, moderação oculta e tempo real.

## Stack
- Next.js
- TypeScript
- Tailwind CSS
- Socket.IO
- Prisma
- PostgreSQL

## Funções prontas
- chat público anônimo
- nome customizado com opção de lembrar sessão
- nome secreto que ativa moderador oculto no backend
- nome mascarado para o moderador
- apagar mensagem
- limpar sala
- bloquear e desbloquear sala
- grupos com senha
- upload de imagem, vídeo e arquivos
- ordem de mensagens: recentes primeiro ou recentes no final

## Instalação
1. Copie `.env.example` para `.env`
2. Ajuste `DATABASE_URL`
3. Ajuste `HIDDEN_ADMIN_NAME`
4. Instale dependências:
   - `npm install`
5. Gere o Prisma Client:
   - `npm run prisma:generate`
6. Rode migração:
   - `npm run prisma:migrate`
7. Rode seed:
   - `npm run seed`
8. Inicie:
   - `npm run dev`

## Observações importantes
### Upload sem perder qualidade
O projeto salva o arquivo original. No exemplo atual, o upload cai em `public/uploads` para desenvolvimento local. Em produção, troque por S3, R2 ou Supabase Storage.

### Admin oculto
A checagem do nome secreto acontece no backend por hash e comparação segura, não no frontend.

### Segurança recomendada antes de produção
- rate limit
- proteção anti-spam
- antivírus/verificação de arquivos
- limite por IP ou hash de dispositivo
- autenticação mais forte para moderação
- logs mais completos
- paginação de mensagens
- thumbnails e CDN para mídia pesada

## Estrutura
- `pages/index.tsx` — chat público + grupos
- `pages/group/[id].tsx` — chat interno do grupo
- `pages/api/...` — API
- `prisma/schema.prisma` — banco
- `server.ts` — servidor Next + Socket.IO

## Limitações desta versão
- grupos aceitam texto; anexo em grupo ainda pode ser expandido
- não há banimento por IP ainda
- falta paginação para alto volume
- falta integração com storage externo de produção
