// Vercel serverless function: POST /api/whatsapp
// Put https://<your-app>.vercel.app/api/whatsapp in Twilio as the
// "A message comes in" webhook (HTTP POST).
const { waitUntil } = require("@vercel/functions");
const { handleMessage } = require("../lib/bot");
const { twiml, sendMessages, canSendAsync } = require("../lib/twilio");

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return Object.fromEntries(new URLSearchParams(req.body));
  return {};
}

module.exports = async (req, res) => {
  const send = (messages) => {
    res.setHeader("Content-Type", "text/xml");
    res.status(200).send(twiml(messages));
  };

  if (req.method !== "POST") {
    res.status(200).send("WhatsApp agent router is running. Twilio should POST here.");
    return;
  }

  const { From: from, To: to, Body: body = "" } = parseBody(req);
  if (!from) return send([]);
  console.log("IN:", from, body);

  try {
    const result = await handleMessage(from, body);
    if (result.immediate) return send(result.immediate);

    if (canSendAsync) {
      // Answer Twilio at once (it times out after 15s), then deliver the
      // agent's reply through the REST API once it is ready.
      waitUntil(
        result.agentTask().then((messages) => sendMessages({ to: from, from: to, messages }))
      );
      return send([]);
    }

    // No Twilio credentials: reply inline (agent must answer within ~15s).
    return send(await result.agentTask());
  } catch (err) {
    console.error("Handler error:", err);
    return send(["⚠️ Something went wrong. Please try again, or type *menu*."]);
  }
};
