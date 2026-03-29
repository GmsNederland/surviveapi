const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Client, GatewayIntentBits } = require("discord.js");

const app = express();
app.use(bodyParser.json());
app.use(cors({ origin: "*" }));

const PORT = process.env.PORT || 10000;

// Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ]
});

client.once("ready", () => {
  console.log(`Bot online als ${client.user.tag}`);
});

// ✅ voice-data route
app.get("/api/voice-data", async (req, res) => {
  try {
    const guild = await client.guilds.fetch("1062808198328893520");

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

// ✅ roblox route
app.post("/roblox", (req, res) => {
  const data = req.body;

  if (data.secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
    return res.status(403).json({ error: "Forbidden" });
  }

  console.log("Data ontvangen van Roblox:", data);

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server draait op ${PORT}`);
});

// bot login
client.login(process.env.TOKEN);// // index.js (CommonJS)
// const express = require("express");
// const bodyParser = require("body-parser");

// const app = express();
// const PORT = process.env.PORT || 10000;

// app.use(bodyParser.json());

// app.post("/roblox", (req, res) => {
//     const data = req.body;

//     if (data.secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
//         return res.status(403).json({ error: "Forbidden" });
//     }

//     console.log("Data ontvangen van Roblox:", data);

//     // Discord webhook kan hier
//     // fetch("WEBHOOK_URL", {...})

//     return res.status(200).json({ success: true });
// });

// app.listen(PORT, () => {
//     console.log(`Server draait op ${PORT}`);
// });