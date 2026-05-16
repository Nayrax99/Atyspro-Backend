# AtysPro Backend — Contexte Claude Code

> Fichier lu par Claude Code à l'ouverture de ce repo. Pour le contexte global, voir `../CLAUDE.md`.

## 🎯 Rôle du backend

Next.js 16 (App Router) qui sert :
- **Dashboard web** pour artisans (`/dashboard/*`)
- **API REST** pour mobile + dashboard (`/api/*`)
- **Webhooks Twilio** (voice : retourne TwiML pointant vers Railway / sms : legacy)
- **Push notifications** Web Push PWA
- **Cron job** rappels de leads non traités

⚠️ **Le voice runtime N'EST PAS ici**. Maya tourne sur Railway (`../websocket/`). Le backend ne fait QUE retourner le TwiML qui pointe vers le WebSocket.

## 🏗️ Architecture (post-sprint 0.3)

```
backend/src/
├── app/
│   ├── api/
│   │   ├── auth/                login, signup, logout, me, onboarding, callback, forgot-password, refresh
│   │   ├── leads/               GET list (+ ?format=csv), GET/PATCH [id], GET [id]/sms
│   │   ├── account/             GET + PATCH
│   │   ├── calls/               GET list avec KPIs
│   │   ├── stats/               GET dashboard stats
│   │   ├── admin/               accounts, overview, test-push (is_admin only)
│   │   ├── push/subscribe/      Web Push PWA
│   │   ├── cron/reminder/       Cron (CRON_SECRET)
│   │   ├── webhooks/twilio/
│   │   │   ├── voice/route.ts   ← Retourne TwiML ConversationRelay
│   │   │   └── sms/             Legacy SMS qualification
│   │   └── dev/                 seed, simulate (disabled prod)
│   ├── dashboard/               UI artisan (leads, stats, calls, account, admin)
│   ├── auth/                    Login, signup, onboarding
│   ├── admin/                   Pages admin (is_admin only)
│   └── mobile/                  Routes web mobile-specific
├── components/                  dashboard/, mobile/, ui/
├── contexts/                    DashboardContext
├── db/
│   ├── schema.sql               ← Schéma consolidé (post migration 014)
│   ├── schema.dbml              ← Pour dbdiagram.io
│   └── migrations/              001 → 014
├── domain/                      ← Logique métier (sprint 0.3)
│   └── leads/                   parsing, scoring, status, service, types, scoring-config
├── lib/                         auth, db, smsTemplates, supabase, twilioClient, utils
│                                (lead*.ts déplacés dans domain/leads/ au sprint 0.3)
├── modules/                     dev/, health/, notifications/, twilio/
│                                (leads/ déplacé dans domain/leads/ au sprint 0.3)
└── theme/                       index, skins/, tokens/
```

**Pattern** : routes API THIN — validation → service → `NextResponse.json()`. Logique métier dans `domain/<topic>/service.ts` ou `modules/<domain>.service.ts`.

## 🗄️ DB Schema (post-migration 014)

Tables :
- `accounts` (id, user_id, email, first_name, last_name, company_name, city, specialty, pro_phone, assistant_name, artisan_name, welcome_message, score_threshold, callback_delay, onboarding_completed, is_admin)
- `phone_numbers` (id, account_id, e164 UNIQUE, active)
- `leads` (23 colonnes — voir ci-dessous)
- `calls` (id, account_id, twilio_call_sid UNIQUE, direction, from_number, to_number, status, started_at, ended_at, voice_ai_result JSONB)
- `sms_messages` (id, account_id, from_number, to_number, direction, body, twilio_message_sid UNIQUE)
- `scoring_configs` (specialty PK, type_weights, delay_weights, danger_weights, scope_weights, type_code_map, special_rules)
- `push_subscriptions` (id, account_id, subscription JSONB, endpoint, platform, created_at)

### Table `leads` (23 colonnes)

```
id, created_at, account_id, status, address, client_phone, type_code, delay_code,
full_name, description, raw_message, relance_count, priority_score, value_estimate,
last_inbound_sms_at, danger_level, scope, availability_notes, parsing_confidence,
reminder_sent_at, twilio_call_sid, source, call_transcript
```

**`status` est un ENUM Postgres `lead_status`** avec EXACTEMENT 3 valeurs :
- `a_traiter` (default, NOT NULL)
- `incomplet`
- `traite`

**JAMAIS de `nouveau`** stocké. Le badge "Nouveau" est calculé UI depuis `created_at < now - 24h`.

**Index UNIQUE** :
- `leads_account_phone_unique` sur `(account_id, client_phone)` — dedup global
- `leads_account_id_twilio_call_sid_key` sur `(account_id, twilio_call_sid)`

### ⛔ Colonnes fantômes supprimées (migration 014) — NE PAS RÉINTRODUIRE

```
contact_name → utilise full_name
phone → utilise client_phone
score → utilise priority_score
request_text → utilise description
job_type → utilise type_code
urgency → utilise delay_code
is_dangerous → utilise danger_level
estimated_scope → utilise scope
logement_type → supprimé
callback_delay → seulement sur accounts, plus sur leads
```

## 🔐 3 clients Supabase, ne jamais les mélanger

```typescript
createSupabaseClient(token)  // Tous endpoints authentifiés — RLS active
supabaseAdmin                // Webhooks, WebSocket, seed, cron — bypass RLS
supabase (anon)              // Legacy uniquement, à éviter
```

## 🛡️ Auth

```typescript
getAuthUser(req)    // → AuthContext | null
requireAuth(req)    // → AuthContext (throws 401)
// AuthContext = { user: { id, email }, account_id, token }
```

JWT depuis `Authorization: Bearer <token>` (mobile) ou cookie `sb-access-token` (web). Valide 7 jours.

## 📋 Conventions

### Routes API
- Routes THIN : validation → service → response
- Format : `{ success: true, data: ... }` ou `{ success: false, error: "..." }`
- Webhooks Twilio : `{ ok: true/false, ... }`
- TypeScript strict, pas de `any`
- Code en anglais, commentaires/UI en français
- JSDoc en français sur fonctions publiques

### Validation
- UUIDs : `isValidUuid()` (`src/lib/utils.ts`)
- Status leads : `LeadStatus` type strict (3 valeurs)
- `ALLOWED_FIELDS` strict sur PATCH `/api/leads/[id]` : uniquement `status`, `full_name`, `address`

### Tests (sprint 0.5)
- Vitest configuré
- `tests/leads/status.test.ts` — 9 tests sur la logique de statut
- Lancer : `npm test`

## 🚦 Bugs critiques fixés (à connaître)

### Sprint 0.6 — Tri dashboard `priority_score`
**Avant** : `.order("score")` dans `modules/leads/leads.service.ts` (colonne fantôme, Supabase ignore silencieusement → tri par date au lieu de priorité)
**Après** : `.order("priority_score")` dans `domain/leads/service.ts`

### Sprint 0.6 — Validation `urgency` fantôme
**Avant** : route PATCH validait `urgency` (0-10) → colonne n'existe pas → erreur silencieuse
**Après** : validation supprimée, `ALLOWED_FIELDS` purgé

## 🔧 Twilio voice webhook (le seul lien backend ↔ voice)

`src/app/api/webhooks/twilio/voice/route.ts` (lignes ~85-95) :

```typescript
return new Response(
  `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="${wsUrlXml}"
      language="fr-FR"
      ttsProvider="ElevenLabs"
      voice="HuLbOdhRlvQQN8oPP0AJ"
      elevenlabsTextNormalization="auto"
    />
  </Connect>
</Response>`,
  { headers: { 'Content-Type': 'text/xml' } }
);
```

⚠️ Si tu modifies les paramètres TwiML (voice, ttsProvider, normalization), tu modifies UNIQUEMENT ce fichier. Le runtime websocket sur Railway n'est pas concerné.

## 🚀 Commandes

```bash
npm run dev              # localhost:3000
npm run build            # prod build + typecheck
npm run lint
npm test                 # Vitest (9 tests)
```

## 🌐 Env vars (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WEBHOOK_BASE_URL    ← Pour signature validation
RAILWAY_WS_URL              ← Host du WebSocket Railway (sans wss://)
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
CRON_SECRET
NEXT_PUBLIC_APP_URL
NODE_ENV
```

## 📋 Checklist avant push

- [ ] `npm run build` passe
- [ ] `npm test` passe (9 tests)
- [ ] Pas de référence aux colonnes fantômes (`contact_name`, `phone`, `score`, etc.)
- [ ] Pas de business logic dans `app/api/*` (déléguer à `domain/` ou `modules/`)
- [ ] `supabaseAdmin` jamais utilisé dans endpoints authentifiés
- [ ] UI en français, code en anglais
- [ ] Pas d'`any` TypeScript

## 🔗 Liens utiles

- Repo : `Nayrax99/Atyspro-Backend`
- Deploy : `https://atyspro-backend.vercel.app`
- Supabase : projet `drrbtegznxaybmnckadd`
