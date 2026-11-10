# Rules for this repo

## Homepage previews: deploy every build yourself

After any preview build or change, deploy it yourself with Wrangler:

```bash
npx wrangler pages deploy previews/<slug> --project-name=byw-<slug> --branch=main --commit-dirty=true
```

- `<slug>` is the business-name slug (the data file name in `prospects/`, e.g. `horizon-heating-air`).
- If the project does not exist yet, create it first:
  `npx wrangler pages project create byw-<slug> --production-branch=main`
- Use the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` environment variables. Never print the token.
  - In a Claude Code cloud session the token is saved as a network secret for api.cloudflare.com and the proxy injects it.
    There is no variable holding it, so run Wrangler with `CLOUDFLARE_API_TOKEN=proxy-injected` (a placeholder the proxy replaces).
    Get the account ID with `GET https://api.cloudflare.com/client/v4/accounts` if `CLOUDFLARE_ACCOUNT_ID` is not set.
- Cloud-session catch: in a Claude Code cloud session the proxy overwrites Wrangler's short-lived upload token with the
  API token, so `wrangler pages deploy` fails at "check-missing" (code 8000013), and Wrangler 4.159+ sends
  `pages project create` to Workers. There is no working workaround yet: a deployment sent without the upload step
  serves 500s for any file Cloudflare does not already have. In that case, build the zip instead
  (`cd previews/<slug> && zip -qr -X <scratchpad>/byw-<slug>.zip . -x ".*"`, index.html at the top level) and send it
  to Ben for Create deployment, and say why.
- A brand-new project's pages.dev link can return 500 for a few minutes while Cloudflare sets up the domain.
- Before redeploying an existing project, compare the live page with your build. Another session may have deployed newer work.
- When the deploy finishes, send Ben the live `https://byw-<slug>.pages.dev/` link and a phone screenshot of the deployed page.
- No zip files unless Ben asks for one.
