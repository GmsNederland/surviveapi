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
client.login(TOKEN);