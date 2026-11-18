const agents = require("./agents");
const store = require("./store");

const HISTORY_LIMIT = 10; // lines of history sent to the agent as context
const MAX_WA_LENGTH = 1500; // WhatsApp/Twilio limit is 1600 chars per message

function menuText(prefix = "") {
  const list = agents.map((a) => `${a.key}️⃣ ${a.name}`).join("\n");
  return (
    `${prefix}🤖 Welcome! Which agent do you want to talk to?\n\n${list}\n\n` +
    `Reply with ${agents.map((a) => a.key).join(" or ")}.\n` +
    `Type *menu* any time to switch agent.`
  );
}

function findAgent(msg) {
  const m = msg.toLowerCase().replace(/[^\w\s]/g, "").trim();
  return agents.find((a) => a.key === m || a.aliases.includes(m)) || null;
}

// Convert common Markdown from the agents into WhatsApp formatting.
function toWhatsApp(text) {
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, "*$1*") // **bold** -> *bold*
    .replace(/__(.+?)__/g, "*$1*")
    .replace(/^#{1,6}\s+(.+)$/gm, "*$1*") // # Heading -> *Heading*
    .replace(/\s+(\d+)\.\s+(?=\*)/g, "\n$1. "); // put numbered items on new lines
}

function splitMessage(text, size = MAX_WA_LENGTH) {
  const chunks = [];
  let rest = String(text);
  while (rest.length > size) {
    // split on a newline or space where possible
    let cut = rest.lastIndexOf("\n", size);
    if (cut < size * 0.5) cut = rest.lastIndexOf(" ", size);
    if (cut < size * 0.5) cut = size;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

// Pull a readable answer out of whatever JSON the agent returns.
function extractReply(data) {
  if (data == null) return "";
  if (typeof data === "string") {
    try {
      return extractReply(JSON.parse(data));
    } catch {
      return data;
    }
  }
  if (Array.isArray(data)) {
    return data.map(extractReply).filter(Boolean).join("\n");
  }
  if (typeof data === "object") {
    for (const k of ["text", "response", "output", "answer", "reply", "message", "result", "content", "data"]) {
      if (data[k] != null) {
        const v = extractReply(data[k]);
        if (v) return v;
      }
    }
    return JSON.stringify(data);
  }
  return String(data);
}

async function callAgent(agent, history, msg) {
  const text = history.length
    ? `Previous Conversation:\n${history.join("\n")}\n\nCurrent User Request:\n${msg}`
    : msg;

  const res = await fetch(agent.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatInput: [{ type: "text", text }] }),
    signal: AbortSignal.timeout(55_000),
  });
  const body = await res.text();
  console.log(`[${agent.name}] status=${res.status} body=${body.slice(0, 500)}`);
  if (!res.ok) throw new Error(`Agent HTTP ${res.status}`);
  return extractReply(body).trim() || "(The agent returned an empty response.)";
}

/**
 * Decide what to do with an incoming WhatsApp message.
 * Returns { immediate: string[] } for instant replies (menu, selection),
 * or { agentTask: () => Promise<string[]> } when an agent must be called.
 */
async function handleMessage(user, rawMsg) {
  const msg = (rawMsg || "").trim();
  const lower = msg.toLowerCase();
  const session = await store.get(user);

  // Menu / reset commands
  if (["menu", "reset", "start over", "change agent", "switch"].includes(lower)) {
    await store.clear(user);
    return { immediate: [menuText("🔄 ")] };
  }

  // No agent chosen yet -> expect a choice, else show the menu
  if (!session) {
    const agent = findAgent(msg);
    if (!agent) return { immediate: [menuText()] };
    await store.set(user, { agentKey: agent.key, history: [] });
    return {
      immediate: [`✅ *${agent.name}* activated.\n\nAsk your question. (Type *menu* to switch agent.)`],
    };
  }

  const agent = agents.find((a) => a.key === session.agentKey);
  if (!agent) {
    await store.clear(user);
    return { immediate: [menuText()] };
  }

  // Forward to the selected agent
  return {
    agentTask: async () => {
      try {
        const reply = await callAgent(agent, session.history || [], msg);
        const history = [...(session.history || []), `User: ${msg}`, `Assistant: ${reply}`].slice(-HISTORY_LIMIT);
        await store.set(user, { agentKey: agent.key, history });
        return splitMessage(toWhatsApp(reply));
      } catch (err) {
        console.error(`[${agent.name}] error:`, err.message);
        return [`⚠️ ${agent.name} is unavailable right now. Please try again, or type *menu* to switch agent.`];
      }
    },
  };
}

module.exports = { handleMessage, splitMessage, extractReply, toWhatsApp };
