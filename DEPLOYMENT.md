# Production deployment

The application is one stateless HTTP service: the Vite build, research/color API, and vector PDF export run behind the same origin. A platform only needs to build the repository, inject server-side environment variables, and expose one HTTP port.

## Required configuration

Use Node.js 24 LTS or the supplied Docker image. Configure these secrets on the hosting platform, never in a `VITE_*` variable or a committed file:

```dotenv
OPENAI_API_KEY=sk-...
SAFETY_IDENTIFIER_SECRET=<at-least-32-random-bytes>
```

Optional production values:

```dotenv
OPENAI_RESEARCH_MODEL=gpt-5.6-sol
OPENAI_CREATIVE_MODEL=gpt-5.6-terra
TRUST_PROXY=1
PORT=5173
```

Set `TRUST_PROXY=1` only when the service is behind a trusted load balancer that overwrites `X-Forwarded-For`. The application reads the first forwarded address only in that mode.

Generate the safety secret locally and copy only its output to the platform secret store:

```bash
openssl rand -hex 32
```

## Native Node deployment

Build command:

```bash
npm ci && npm run build
```

Start command:

```bash
npm start
```

The production server binds to `0.0.0.0` by default and reads the platform's `PORT`. Its health endpoint is `GET /api/health`.

## Container deployment

```bash
docker build -t monoblend-label-studio .
docker run --rm -p 5173:5173 \
  -e OPENAI_API_KEY \
  -e SAFETY_IDENTIFIER_SECRET \
  monoblend-label-studio
```

The image includes a health check and runs as the unprivileged `node` user.

## Vercel deployment

Vercel builds the Vite client into `dist` and deploys the four files in `api/` as Node.js Functions. `vercel.json` keeps API routes on those functions and rewrites other application routes to the SPA entry point.

Required Vercel project variables:

```dotenv
OPENAI_API_KEY=sk-...
SAFETY_IDENTIFIER_SECRET=<at-least-32-random-bytes>
```

Do not configure `RESEARCH_PROVIDER=fixture` in Preview or Production. Environment changes apply to the next deployment, so redeploy after adding or rotating a secret. Verify the result at `GET /api/health`; a live deployment must return `researchConfigured: true` and `provider: openai`.

Vercel overwrites `X-Forwarded-For` with the public client IP, and the platform adapter deliberately trusts that header for privacy-preserving safety identifiers. Do not copy that behavior to an untrusted proxy.

## Release gate

Before each release:

```bash
npm ci
npm run check
```

Then verify the production process:

```bash
RESEARCH_PROVIDER=fixture PORT=5173 npm start
curl --fail http://127.0.0.1:5173/api/health
```

The repository CI runs the same typecheck, 17 deterministic tests, production build, and container build on Node.js 24.

## Operational boundaries

- Rate limits are process-local. This is correct for a single application instance and only best-effort on auto-scaling Vercel Functions. For reliable public enforcement, configure Vercel Firewall rate limiting or a shared rate-limit store.
- The app deliberately has no authentication or database. Anyone who can reach a public deployment can consume its AI and PDF endpoints within the configured limits.
- Generated label state lives only in the browser. Refreshing the page starts a new workflow.
- OpenAI requests are not stored by the application and use `store: false`. A keyed, one-way safety identifier is sent when `SAFETY_IDENTIFIER_SECRET` is configured.
- PDF output is vector RGB. A print vendor requiring CMYK profiles, spot colors, or PDF/X still needs a prepress conversion step and physical proof.

## Rollback

Keep the previous image or deployment release available. Rollback is atomic because the service has no migrations or persistent application state.
