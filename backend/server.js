const { Client, GatewayIntentBits } = require("discord.js");
const express = require("express");
const cors = require("cors");


const app = express();
app.use(express.json());
app.use(cors({
  origin: "*"
}));

// 🔑 CONFIG
const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;

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

// 📡 API: voice data ophalen
app.get("/api/voice-data", async (req, res) => {
  try {
    const guild = await client.guilds.fetch(GUILD_ID);

    const channels = guild.channels.cache
      .filter(c => c.isVoiceBased())
      .map(channel => ({
        id: channel.id,
        name: channel.name,
        members: channel.members.map(m => ({
          id: m.id,
          username: m.user.username
        }))
      }));

    res.json({ channels });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fout bij ophalen" });
  }
});

// 🚀 API: user verplaatsen
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
    console.error(err);
    res.status(500).json({ error: "Move failed" });
  }
});

// 🌐 Server starten (Railway compatible)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API draait op poort ${PORT}`);
});

// 🤖 Bot starten
client.login(TOKEN);