# Team Bot

WhatsApp bot for the team: message it and it creates a Linear issue.

```
Console crashes when casting          ← first line: issue title
Happens on Quest 3 after pairing…     ← the rest: description
```

The bot replies with the issue identifier and link. `help` shows usage.

Internal tool only. It has no database and no access to the platform API.
It runs as its own container on the VPS (`bot.virtality.app`), separate from
the prod/preview API.

## How it works

1. Meta POSTs every WhatsApp event to `/webhook`, signed with the App Secret.
2. The bot checks `X-Hub-Signature-256`, answers `200` right away, and
   handles the message after the response (Meta retries slow deliveries).
3. Messages are ignored when they are repeats of a delivery already handled
   (by message id), sent to another number on the app, or from a number not
   in `TEAM_BOT_ALLOWED_SENDERS`. Strangers get no reply.
4. It creates the issue through Linear's GraphQL API, then replies in the chat.

`src/app.ts` uses no Node APIs, so the bot can move to Cloudflare Workers
with a new entry file only.

## Local development

```bash
cp services/team-bot/.env.example services/team-bot/.env   # fill it in
pnpm dev:team-bot                                           # :8080
cloudflared tunnel --url http://localhost:8080              # or ngrok
```

Set the tunnel URL + `/webhook` as the callback URL in the Meta App Dashboard.
Production and your tunnel cannot both be subscribed at once. Use a separate
Meta test app for local work, or point the callback back to production when
you're done.

```bash
pnpm --filter @virtality/team-bot test
```

## Meta setup (one-time)

In the [Meta App Dashboard](https://developers.facebook.com/apps):

1. **Create app** of type _Business_ and add the **WhatsApp** product.
2. **WhatsApp → API Setup**: note the **Phone Number ID**. The test number
   works to start with. Add teammates' numbers as test recipients. A real
   number needs business verification.
3. **App settings → Basic**: copy the **App Secret** → `WHATSAPP_APP_SECRET`.
4. **Access token**: the API Setup token expires in 24h. For production, go
   to Business Settings → Users → **System users**, create one, assign the
   app with full control, and generate a token with
   `whatsapp_business_messaging` and `whatsapp_business_management` →
   `WHATSAPP_ACCESS_TOKEN`.
5. **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://bot.virtality.app/webhook`
   - Verify token: the value of `WHATSAPP_VERIFY_TOKEN`
   - Verify and save, then **subscribe to the `messages` field**.

The service must be running and reachable before step 5, because Meta calls
`GET /webhook` to verify.

## Linear setup

- **API key**: Linear → Settings → Security & access → Personal API keys →
  `LINEAR_API_KEY`. Issues show this key's owner as creator. A dedicated
  "bot" Linear user keeps that clear.
- **Team ID**: run `{ teams { nodes { id name } } }` in the API explorer, or
  copy it from the team's settings → `LINEAR_TEAM_ID`.

## Deploy

CI (`.github/workflows/deploy-team-bot.yml`) builds
`ghcr.io/virtality-app/virtality-team-bot:production` on push to `main` and
runs `./scripts/infra.sh team-bot-up` on the VPS. Secrets live in the infra
repo at `team-bot/.env.production`.
