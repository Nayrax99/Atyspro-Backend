# backend/ — Next.js 16 App Router

> Lis `../CLAUDE.md` à la racine d'abord pour le contexte global.

## Rôle

Dashboard web (Next.js App Router), API REST consommée par mobile + dashboard, webhooks Twilio (voice + SMS legacy), cron de rappel, push notifications PWA. **N'inclut PAS la logique voice runtime** (qui est dans `websocket/`).

## Structure actuelle

```
backend/src/
├── app/
│   ├── api/                     Routes thin : valider → service → response
│   │   ├── auth/                login, signup, logout, me, callback, onboarding, refresh, forgot-password
│   │   ├── leads/               GET liste (+ ?format=csv), GET/PATCH [id], GET [id]/sms
│   │   ├── account/             GET + PATCH compte
│   │   ├── calls/               GET liste appels + KPIs
│   │   ├── stats/               GET stats dashboard
│   │   ├── admin/               accounts list, overview, test-push (is_admin only)
│   │   ├── push/subscribe/      Web Push subscribe/unsubscribe
│   │   ├── cron/reminder/       Cron rappel (CRON_SECRET protégé)
│   │   ├── webhooks/twilio/
│   │   │   ├── voice/route.ts   → retourne TwiML ConversationRelay vers Railway
│   │   │   └── sms/route.ts     → flow SMS legacy, kept for safety
│   │   └── dev/                 seed, simulate (403 en production)
│   ├── dashboard/               Pages : /, /leads/[id], /calls, /stats, /account, /notifs
│   ├── auth/                    Login/signup/onboarding
│   └── admin/                   Pages admin (is_admin only)
├── components/                  dashboard/, mobile/, ui/
├── contexts/                    DashboardContext
├── db/migrations/               001 → 011 (à consolider en schema.sql sprint 0)
├── lib/                         auth, db, leadParsing, leadScoring, leadStatus, scoringConfig, smsTemplates, supabase, twilioClient, utils
├── modules/                     dev/, health/, leads/, notifications/, twilio/
├── theme/                       index, skins/, tokens/
└── types/                       global.types.ts, lead.ts
```

## Pattern routes API

```ts
// /app/api/leads/[id]/route.ts
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req);                    // throws ApiError 401 si pas authentifié
  const body = await req.json();
  const updated = await leadsService.updateLead(auth, params.id, body);  // logique dans modules/leads/
  return NextResponse.json({ success: true, data: updated });
}
```

**Règles** :
- Routes : validation + appel service + réponse uniquement
- Logique métier : `src/modules/<domain>/<domain>.service.ts` (sera consolidé dans `domain/` sprint 0)
- Validation → `lib/utils.ts` ou helpers Zod
- Erreurs → throw `ApiError` (gestion centralisée)

## Supabase clients (3 — ne pas mélanger)

```ts
import { createSupabaseClient } from "@/lib/supabase";  // RLS user — endpoints authentifiés
import { supabaseAdmin } from "@/lib/supabase";          // service_role — webhooks, cron, dev
// supabase (anon) → legacy uniquement
```

**Endpoint authentifié** :
```ts
const auth = await requireAuth(req);
const supabase = createSupabaseClient(auth.token);
const { data } = await supabase.from("leads").select("*");  // RLS appliquée
```

**Webhook Twilio** :
```ts
const { data } = await supabaseAdmin.from("phone_numbers").select(...);  // bypass RLS
```

## Dashboard pages

| Route | Rôle | Fichier |
|---|---|---|
| `/dashboard` | Liste leads, filtres, tri, export CSV | `app/dashboard/page.tsx` (639 lignes — à splitter sprint 4) |
| `/dashboard/leads/[id]` | Fiche lead détaillée | `app/dashboard/leads/[id]/page.tsx` |
| `/dashboard/calls` | Historique appels + KPIs + slide-over | `app/dashboard/calls/page.tsx` |
| `/dashboard/stats` | Stats avancées | `app/dashboard/stats/page.tsx` |
| `/dashboard/account` | Profil + Paramètres + Abonnement (3 onglets) | `app/dashboard/account/page.tsx` |
| `/dashboard/notifs` | Placeholder vide (à remplir) | `app/dashboard/notifs/page.tsx` |

⚠️ **Inline styles partout** dans le dashboard (Tailwind 4 a des soucis de compilation sur certains composants). Continuer en inline pour tout nouveau code dashboard. Variables CSS `--ap-*` définies dans `app/globals.css`.

## Auth

```ts
getAuthUser(req): AuthContext | null
requireAuth(req): AuthContext  // throw ApiError 401 sinon
// AuthContext = { user: { id, email }, account_id, token }
```

JWT depuis `Authorization: Bearer <token>` (mobile) ou cookie `sb-access-token` (web). Valide 7 jours, pas de refresh token. Si expiré → 401 → mobile fait logout + redirect login.

## Notifications Push (Web Push)

- Service Worker : `public/sw.js`
- VAPID env : `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- Service : `modules/notifications/notifications.service.ts` → `sendPushNotification(account_id, payload)`
- **Trigger 1 (PAS ENCORE — sprint 2)** : nouveau lead créé avec `priority_score >= account.score_threshold`. Sera déclenché depuis le WebSocket via un endpoint backend.
- **Trigger 2 (actif)** : cron quotidien sur leads `a_traiter` depuis `callback_delay`, protégé par `CRON_SECRET`

## Webhook voice (`api/webhooks/twilio/voice/route.ts`)

Rôle minimaliste :
1. Valider signature Twilio (sauf en dev)
2. Résoudre `accountId` via `phone_numbers.e164 = To`
3. Récupérer `assistant_name`, `specialty`, `artisan_name` du compte
4. Retourner TwiML `<Connect><ConversationRelay url="wss://${RAILWAY_WS_URL}/ws?accountId=...&specialty=...&assistantName=...&artisanName=..." language="fr-FR" ttsProvider="ElevenLabs" voice="HuLbOdhRlvQQN8oPP0AJ" />`

⚠️ **Encoder les params** dans l'URL avec `encodeURIComponent` + remplacer `&` par `&amp;` dans le XML.

## Règles spécifiques au repo

1. **Pas de logique métier dans les routes** → tout dans `modules/<domain>/<domain>.service.ts`.
2. **Pas de `supabaseAdmin` dans endpoints authentifiés** → `createSupabaseClient(token)`.
3. **Twilio signatures validées en prod** (`validateTwilioSignature` dans `lib/twilioClient.ts`).
4. **Voice runtime n'appartient pas ici** — modifications voice → `websocket/`. Le webhook ici fait juste de la résolution + génération TwiML.
5. **`/api/dev/*` retourne 403 en production** (vérifier `NODE_ENV`).
6. **Edge runtime incompatible** avec Twilio SDK (HMAC-SHA1 natif Node) → `export const dynamic = "force-dynamic"` sur les webhooks.
7. **CSS `--ap-*` source de vérité** → ne pas hardcoder de couleurs hex dans les composants dashboard.
8. **UI terminologie** : "demande" pas "lead", "priorité" pas "score" en français user-facing.

## Variables d'environnement

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WEBHOOK_BASE_URL`, `RAILWAY_WS_URL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `NODE_ENV`

## Migrations Supabase

Dans `src/db/migrations/`. **À exécuter manuellement** dans le SQL Editor Supabase (pas de CLI Supabase migrations setup). Pour ajouter une migration :
1. Créer `012_<nom>.sql` (numéro suivant)
2. Tester en local (Supabase local ou directement projet dev)
3. Appliquer en prod via SQL Editor
4. Mettre à jour `CLAUDE.md` racine si le schéma change

Migration en cours sprint 0 : générer `db/schema.sql` consolidé pour servir de référence rapide.
