# Setting up the Cloudflare account that powers automated translation

`scripts/translate.mjs` needs an OpenAI-compatible chat-completions endpoint.
The chosen provider is **Cloudflare Workers AI on the Workers Free plan**,
because it is the only option that keeps this pipeline free for an open-source
project (see the *Translations* section of the repo's `CLAUDE.md` for the
alternatives that were rejected and why). This how-to walks through creating
the account, the one API token it needs, and the three GitHub settings that
turn `.github/workflows/translate.yml` back on.

Time required: about 15 minutes. Cost: $0 — no domain, no payment method, no
plan upgrade.

## 1. Create the account

1. Go to <https://dash.cloudflare.com/sign-up> and sign up with an email the
   project controls (a shared/role address such as the FOG Project admin
   mailbox, **not** a personal address — whoever holds this mailbox can reset
   the account). Verify the email when the confirmation arrives.
2. Skip everything the onboarding offers. You do **not** need to add a
   website/domain, change nameservers, or enter a payment method. Close any
   "add your first site" prompt — Workers AI is account-level and needs no
   zone.
3. That's it for plans: every new account is on **Workers Free**, which
   includes Workers AI with **10,000 Neurons per day**, resetting at
   00:00 UTC. Do not buy Workers Paid; the pipeline is budgeted to fit the
   free allocation.

> **Which model, and why the plan matters:** the pipeline uses
> `@cf/zai-org/glm-4.7-flash`, which is explicitly on the Free-plan model
> list. Cloudflare moved some larger models (e.g. `glm-5.2`, the Kimi K2
> models) behind Workers Paid in July 2026 — those return HTTP 403 (error
> 5035) on a free account. If the model is ever changed, check it is still
> free-plan-eligible in the [model catalog](https://developers.cloudflare.com/workers-ai/models/).

## 2. Find the Account ID

1. In the dashboard, the Account ID is on the account home page's right-hand
   sidebar (or under **Workers & Pages** → *Overview*, right side). It's a
   32-character hex string.
2. Save it — it goes into the endpoint URL in step 5. It is an identifier,
   not a secret.

## 3. Create the API token

1. Go to **My Profile** (top-right avatar) → **API Tokens** →
   **Create Token** → **Create Custom Token**.
2. Configure it:
   - **Name:** `fog-docs-translate`
   - **Permissions:** exactly one — **Account → Workers AI → Read**.
     (Despite the name, *Read* is the permission that authorizes running
     inference. Don't grant Edit; the pipeline never changes anything.)
   - **Account Resources:** *Include → (this account)*.
   - Leave TTL and IP filtering off — the nightly workflow needs it working
     unattended, and a token that silently expires recreates the exact
     failure mode this replaces.
3. **Continue to summary** → **Create Token**. Copy the token now — it is
   shown once.

## 4. Test before touching GitHub

From any shell (bash shown; substitute your two values):

```bash
ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TOKEN=your-api-token

curl -sS "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/ai/v1/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"@cf/zai-org/glm-4.7-flash","messages":[{"role":"user","content":"Say bonjour."}]}'
```

A JSON response with a `choices[0].message.content` field means everything
works. Errors to recognize:

| Response | Meaning |
|---|---|
| `401` / authentication error | Token wrong, or missing the Workers AI Read permission |
| `403` (error 5035) | Model requires Workers Paid — pick a free-plan model |
| `404` | Account ID wrong, or a typo in the URL path |
| `429` (error 3036) | The day's 10,000 Neurons are spent; resets 00:00 UTC |

## 5. Wire it into the repo

In the GitHub repo, **Settings → Secrets and variables → Actions**:

- Under **Secrets**, add `TRANSLATE_API_KEY` = the API token from step 3.
- Under **Variables**, add:
  - `TRANSLATE_ENDPOINT` =
    `https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1/chat/completions`
    (with the real Account ID substituted)
  - `TRANSLATE_MODEL` = `@cf/zai-org/glm-4.7-flash`

No workflow edit is needed — `translate.yml` already reads all three and
sends the same bearer header Cloudflare expects.

## 6. Verify end to end

1. In the repo's **Actions** tab, run the *translate* workflow manually
   (workflow_dispatch), or push a trivial edit to any page under `docs/`.
2. A run that gets past the first page proves auth, endpoint, and model are
   all correct (the old GitHub Models endpoint failed on page one with 410).
3. Watch Neuron usage in the Cloudflare dashboard under
   **AI → Workers AI** — the usage graph is per-day and shows how much of
   the 10,000 the run consumed.

## Operating notes

- **The free allocation is sized for drift, not for seeding.** The nightly
  run exists to drain whatever a burst of English edits deferred past the
  daily budget. Seeding a whole new language from nothing is done by hand,
  in-session (see `.claude/i18n-context.md`), never through this pipeline.
- **When the budget runs out mid-run**, requests fail with 429/3036, the
  script defers the remaining pages, and the nightly run picks them up after
  the 00:00 UTC reset. That is the designed behavior, not an outage.
- **Rotating the token** is: create a new token (step 3), update the
  `TRANSLATE_API_KEY` secret, delete the old token. Nothing else changes.
- The account needs no other Cloudflare services — no Workers deployed, no
  AI Gateway, no R2/KV/D1, no zones. If someone later adds the project's DNS
  to the same account, none of this setup is affected.
