// Helpers for replying to Twilio, without the Twilio SDK.

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(messages = []) {
  const body = messages.map((m) => `<Message>${escapeXml(m)}</Message>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const canSendAsync = Boolean(SID && TOKEN);

// Send a WhatsApp message through the Twilio REST API (used for slow agent replies).
async function sendMessage({ to, from, body }) {
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${SID}:${TOKEN}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  if (!res.ok) console.error("Twilio send failed:", res.status, await res.text());
}

async function sendMessages({ to, from, messages }) {
  for (const body of messages) await sendMessage({ to, from, body }); // keep order
}

module.exports = { twiml, sendMessages, canSendAsync };
