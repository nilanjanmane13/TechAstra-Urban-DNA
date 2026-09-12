# Urban DNA — NVIDIA AI + No Google Billing

Urban DNA is a 3D urban intelligence and decision-support prototype. This version removes the Google Maps/Google Earth dependency entirely, so the 3D city visualization does not require a Google billing account or Google Maps API key.

## Main intelligence
NVIDIA AI powers:
- Ask Urban DNA
- Corridor diagnosis
- Scenario Lab consequence analysis

The NVIDIA key is kept server-side in `.env.local` and is never embedded in browser code.

## 3D city
The visual city is rendered locally in the browser with Three.js. It includes:
- road network and FC Road corridor
- individual buildings
- population visualization
- trees and green zones
- public transport / metro representation
- moving vehicles
- traffic signals
- AQI and heat atmospheric volumes
- interactive orbit / zoom controls

This is an analytical 3D city model, not a claim of live Google imagery or live sensor measurements.

## Run
```powershell
npm install
npm run dev
```
Open http://127.0.0.1:5180/

## NVIDIA key
Create `.env.local`:
```env
NVIDIA_API_KEY=YOUR_NVIDIA_API_KEY
NVIDIA_MODEL=nvidia/nemotron-3-super-120b-a12b
```

Never commit `.env.local` to Git.
