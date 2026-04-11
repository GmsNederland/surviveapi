const express = require("express");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 3000;

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const GUILD_ID = "1062808198328893520";

const actieveDiensten = new Map();
let amberAlert = null;

let luchtalarmState = {
  type: null,
  nummer: null,
  timestamp: 0
};

// 🤖 Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

// ✅ Bot ready
client.once("ready", () => {
  console.log(`Bot online als ${client.user.tag}`);
});

// 🌐 Root route (fix 404 op "/")
app.get("/", (req, res) => {
  res.send("API is running 🚀");
});

// 📡 Voice data ophalen
app.get("/api/voice-data", async (req, res) => {
  try {
    if (!client.isReady()) {
      return res.status(503).json({ error: "Bot not ready" });
    }

    const guild = client.guilds.cache.get(GUILD_ID);

    if (!guild) {
      return res.status(500).json({ error: "Guild not found in cache" });
    }

    // Optioneel: members fetch (met try/catch)
    try {
      await guild.members.fetch();
    } catch (e) {
      console.warn("Members fetch failed:", e.message);
    }

    const channels = guild.channels.cache
      .filter(c => c.isVoiceBased())
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        members: channel.members.map(m => ({
          id: m.id,
          username: m.user.username,
  roles: m.roles.cache
    .filter(r => r.id !== GUILD_ID) // optioneel @everyone eruit
    .map(r => r.name)        }))
      }));

    res.json({ channels });

  } catch (err) {
    console.error("voice-data error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// api luchtalarm status
app.get("/api/luchtalarm/status", (req, res) => {
  res.json(luchtalarmState);
});

// 🚀 User verplaatsen
app.post("/api/move-user", async (req, res) => {
  try {
    const { userId, channelId } = req.body;

    const guild = await client.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(userId);

    if (!member.voice.channel) {
      return res.status(400).json({ error: "User zit niet in voice" });
    }

    await member.voice.setChannel(channelId);

    res.json({ success: true });

  } catch (err) {
    console.error("move-user error:", err);
    res.status(500).json({ error: "Move failed" });
  }
});

// 🤝 Roblox endpoint
app.post("/roblox", (req, res) => {
  const data = req.body;

  if (data.secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
    return res.status(403).json({ error: "Forbidden" });
  }

  console.log("Data ontvangen van Roblox:", data);

  res.json({ success: true });
});

// 🚨 LUCHTALARM TRIGGER
app.post("/api/luchtalarm", (req, res) => {
  try {
    const { secret, type, nummer } = req.body;

    // 🔐 beveiliging
    if (secret !== process.env.LUCHTALARM_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (!type) {
      return res.status(400).json({ error: "Missing type" });
    }

    if (type === "single" && typeof nummer !== "number") {
      return res.status(400).json({ error: "Missing nummer" });
    }

    luchtalarmState = {
      type,
      nummer: nummer || null,
      timestamp: Date.now()
    };

    console.log("🚨 LUCHTALARM TRIGGER:", luchtalarmState);

    res.json({
      success: true,
      state: luchtalarmState
    });

  } catch (err) {
    console.error("luchtalarm error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// luchtalarm api legen
app.post("/api/luchtalarm/clear", (req, res) => {
  // simpel (geen secret in Roblox)
  // je kunt hier later IP / rate limit toevoegen

  luchtalarmState = {
    type: null,
    nummer: null,
    timestamp: 0
  };

  console.log("🧹 LUCHTALARM CLEARED");

  res.json({ success: true });
});

// amberalert deel
app.post("/api/amberalert", (req, res) => {
  const { type, playerName, info } = req.body;

  if (type !== "amberalert") {
    return res.status(400).json({ error: "Invalid type" });
  }

  amberAlert = {
    playerName,
    info,
    timestamp: Date.now()
  };

  console.log("🚨 AMBER ALERT:", amberAlert);

  res.json({ success: true });
});

app.get("/api/amberalert", (req, res) => {
  res.json(amberAlert || { active: false });
});

app.post("/api/amberalert/clear", (req, res) => {
  amberAlert = null;
  res.json({ success: true });
});
// ================================
// 📍 REALTIME TRACKING (STABIEL)
// ================================

const playerLocations = new Map();

// Cleanup (ghost players fix)
const PLAYER_TIMEOUT = 10000;

setInterval(() => {
  const now = Date.now();

  for (const [userId, data] of playerLocations.entries()) {
    if (now - data.lastUpdate > PLAYER_TIMEOUT) {
      playerLocations.delete(userId);
    }
  }
}, 5000);


// 📡 POST TRACKING (ULTRA FAST RESPONSE)
app.post("/player-locations", (req, res) => {

  // 🔥 BELANGRIJK: DIRECT RESPONSE → voorkomt timeout
  res.sendStatus(200);

  const updates = req.body;
  if (!Array.isArray(updates)) return;

  for (const data of updates) {
    if (!data || !data.userId) continue;

    // REMOVE player
    if (data.type === "remove") {
      playerLocations.delete(data.userId);
      continue;
    }

    // UPDATE player
    if (data.type === "update") {

      // minimale validatie
      if (!data.mapPosition) continue;

      playerLocations.set(data.userId, {
        userId: data.userId,
        username: data.username || "unknown",
        team: data.team || "unknown",

        // 🔥 MAP READY
        mapPosition: {
          x: Math.max(0, Math.min(1, data.mapPosition.x || 0)),
          y: Math.max(0, Math.min(1, data.mapPosition.y || 0))
        },

        lastUpdate: Date.now()
      });
    }
  }
});

// 🌍 GET TRACKING DATA (VOOR WEBSITE)
app.get("/player-locations", (req, res) => {
  res.json({
    players: Array.from(playerLocations.values())
  });
});

// 📻 Roblox Radio Status endpoint
app.post("/radiostatus", (req, res) => {
  const data = req.body;

  console.log("📡 RADIO:", data);

  const username = data.username?.toLowerCase();

  const dienst = actieveDiensten.get(username);

  if (!dienst) {
    console.log("❌ Niet in dienst:", username);
    return res.status(403).json({ error: "User not in service" });
  }

  console.log("✅ IN DIENST:", dienst.discordNaam);

  res.json({
    success: true,
    discord: dienst.discordNaam
  });
});

app.post("/set-dienst", (req, res) => {
  const { robloxNaam, discordId, discordNaam } = req.body;

  if (!robloxNaam) {
    return res.status(400).json({ error: "Missing robloxNaam" });
  }

  actieveDiensten.set(robloxNaam.toLowerCase(), {
    discordId,
    discordNaam,
    startTime: Date.now()
  });

  console.log("✅ Dienst gestart:", robloxNaam);

  res.json({ success: true });
});

app.post("/remove-dienst", (req, res) => {
  const { robloxNaam } = req.body;

  if (!actieveDiensten.has(robloxNaam.toLowerCase())) {
    return res.status(404).json({ error: "Not found" });
  }

  actieveDiensten.delete(robloxNaam.toLowerCase());

  console.log("🛑 Dienst gestopt:", robloxNaam);

  res.json({ success: true });
});

let lastAnnouncement = null;

// POST announcement
app.post('/set-announcement', (req, res) => {
    console.log("🚀 ROUTE HIT /set-announcement");
      res.json({ works: true });
  try {
    const { title, message, timestamp, author, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'No message provided' });
    }
    if (!title) {
      return res.status(400).json({ error: 'Geen tittle gevonden'})
    }

    lastAnnouncement = {
      title,
      message,
      timestamp: timestamp || Date.now(),
      author: author || "unknown",
      userId: userId || null
    };

    console.log("📢 Announcement opgeslagen:", lastAnnouncement);

    res.json({ success: true, data: lastAnnouncement });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET announcement
app.get('/last-announcement', (req, res) => {
  if (!lastAnnouncement) {
    return res.status(404).json({ error: 'No announcement' });
  }

  res.json(lastAnnouncement);
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`Server draait op poort ${PORT}`);
});

// 🤖 Start bot
client.login(TOKEN).catch(err => {
  console.error("Login error:", err);
});