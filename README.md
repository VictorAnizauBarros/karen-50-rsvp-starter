# Karen 50 — RSVP

Convite digital temático de Halloween para Karen Ferraz, 50 anos.

## Evento

- 31 de outubro, 1 e 2 de novembro de 2026
- Local e horários ainda fictícios/configuráveis

## Stack

Next.js + TypeScript + Tailwind + Supabase + Vercel.

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra http://localhost:3000

## Próximas etapas

1. Criar projeto Supabase.
2. Executar `supabase/schema.sql`.
3. Configurar `.env.local`.
4. Implementar cliente Supabase server-side.
5. Implementar lookup seguro por invitation_code.
6. Gravar/atualizar RSVP.
7. Criar autenticação administrativa.
8. Criar dashboard.
9. Importar lista de convidados.
10. Publicar na Vercel.
11. Gerar links/QR Codes individuais.

## Observação

A rota `/api/rsvp` atualmente valida o payload e apenas registra no console. Isso é intencional: primeiro fechamos o modelo de dados e segurança antes de ligar a persistência.
