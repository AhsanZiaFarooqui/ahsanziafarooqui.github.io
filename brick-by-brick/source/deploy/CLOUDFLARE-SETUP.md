# Free Cloudflare AI setup

Use **Workers Free**, without paid upgrades, purchased credits or an OpenAI key. Cloudflare currently includes 10,000 Workers AI neurons daily; requests above the free allowance fail. The app then uses its checked built-in explanations. This is limited free usage, not unlimited AI. [Official pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

1. Open https://dash.cloudflare.com and choose **Workers & Pages → Create application → Start with Hello World** (or the equivalent simple Worker option).
2. Name it `brick-maths-ai` and deploy it. No custom domain is needed.
3. Choose **Edit code**. Replace the starter code with the entire contents of `deploy/cloudflare-worker.js`, then **Deploy**. This is a standalone module, not a browser script.
4. Open the Worker's **Bindings** tab. Choose **Add binding → Workers AI**, name the variable exactly `AI`, and save/deploy. If asked to accept service terms, the account owner should read them. Do not enable paid billing.
5. Open its public `https://brick-maths-ai.YOUR-SUBDOMAIN.workers.dev` address. It should display `"mode":"configured"`. This confirms the binding, not a successful model response.
6. Send only that public URL to the person connecting the website. No password, API token or account ID is needed. Set `public/config.json` to `{"aiEndpoint":"https://brick-maths-ai.YOUR-SUBDOMAIN.workers.dev"}`, rebuild and publish.
7. On the maths website, enter a lesson and press **Explain differently**. A validated live response is explicitly labelled **Live AI wording from Cloudflare**. Built-in wording means the model was unavailable or its output failed checks. Check this before presenting live AI at the showcase.

The allowed production origin is `https://ahsanziafarooqui.github.io`. For another website, set the Worker environment variable `ALLOWED_ORIGIN` to its origin (scheme and host only), then redeploy. Local development origins on port 5173 are also accepted. The app keeps all learner progress in the browser.

To rebuild the standalone Worker after source changes: `npm run build:worker`. The selected model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, using a Workers AI binding and a constrained JSON schema. No API secret is required in the frontend or the Worker code. The original optional local OpenAI adapter is not used by this free deployment.

Public origin checks and the per-isolate request limit are modest safeguards, not authentication or a distributed abuse budget. An attacker may exhaust the free daily allowance. Stay on Free so exhaustion causes fallback instead of paid overages. Never paste learner names or personal details into the reasoning field.
