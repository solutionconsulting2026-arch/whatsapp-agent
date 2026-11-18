# WhatsApp Agent Router (Twilio + Vercel)

A WhatsApp user is shown a menu, picks an agent, and every following message is forwarded to that agent:

```
User: Hi
Bot:  🤖 Which agent do you want to talk to?
      1️⃣ RM Assist Retail
      2️⃣ RM Assist Corporate
User: 1
Bot:  ✅ RM Assist Retail activated.
User: <question>   -> sent to the Retail webhook as {"chatInput":[{"type":"text","text":"..."}]}
User: menu         -> back to the menu to switch agent
```

Agents are configured in `lib/agents.js`. You can add more there.

## Deploy on Vercel
1. Import this repo in Vercel (Framework preset: **Other**) and deploy.
2. **Storage (recommended):** Vercel → Storage / Marketplace → **Upstash Redis** → connect it to the project.
   This keeps each user's chosen agent between requests. Without it, users may be asked to choose again after a cold start.
3. **Environment variables (recommended):** `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`.
   With them, the bot replies to Twilio right away and sends the agent's answer when it is ready, so slow agents don't hit Twilio's 15-second timeout.
   Optional: `RM_RETAIL_URL` and `RM_CORPORATE_URL` override the agent webhook URLs.
4. Redeploy after adding env vars or storage.

## Connect Twilio
Twilio Console → Messaging → WhatsApp Sandbox settings (or your WhatsApp sender) →
**When a message comes in**: `https://<your-app>.vercel.app/api/whatsapp`, method **POST**.

## Run locally
```bash
npm install
npm run dev
```
Then POST to `http://localhost:3000/api/whatsapp`, or expose it with ngrok.
