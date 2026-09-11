# Urban DNA — Google 3D Only

This build has ONE entry point: the Urban DNA dashboard at `/`. There is no landing page, login page, Claude page, diagnosis route, or legacy dashboard route.

## Run

1. Open this folder in VS Code.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the exact `Local` URL shown by Vite (this build uses port 5180).

## Google setup

The project reads `VITE_GOOGLE_MAPS_API_KEY` from `.env.local`. A local key is included for the supplied demo. For a public deployment, rotate that key and use a restricted key.

Required Google capability: Maps JavaScript API with 3D Maps enabled/available to the project. Billing and API restrictions may apply.

## If the map is blank

The UI stays visible and an error message is shown over the map. Check the browser console and confirm the key, billing, API enablement, and localhost referrer restrictions.


## NVIDIA AI integration

Urban DNA now uses a server-side NVIDIA NIM proxy at `/api/urban-ai`. The browser never sends the NVIDIA credential directly to the model provider. The Ask Urban DNA, Diagnose corridor, and Scenario Lab actions send the current Urban DNA city context and scenario to NVIDIA.

Set these in `.env.local`:
- `VITE_GOOGLE_MAPS_API_KEY`
- `NVIDIA_API_KEY`
- `NVIDIA_MODEL` (defaults to `nvidia/nemotron-3-super-120b-a12b`)

Run:
```bash
npm install
npm run dev
```

The NVIDIA endpoint is `https://integrate.api.nvidia.com/v1/chat/completions`, using the OpenAI-compatible chat-completions format.
