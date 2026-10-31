# Support agent sample

This sample configures Forgent’s built-in support runtime. It is not an arbitrary code package.

1. Install an OpenRouter API key in `.env.local` as `OPENROUTER_API_KEY`, then restart the development server.
2. Download `public/samples/support-agent.zip` or create a ZIP containing only `manifest.json` at its root.
3. Upload it at `/publish`. The runtime’s input and output schemas are shown after upload.
4. Run its evaluation and publish only after it passes. You can then open its catalog page and use a Forgent API key in the playground.

`priceMicros` is the proposed price in millionths of a US dollar per run. Billing is simulated. The runtime uses the workspace knowledge base and OpenRouter free-model router.
