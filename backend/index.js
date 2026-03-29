// index.js (CommonJS)
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post("/roblox", (req, res) => {
    const data = req.body;

    if (data.secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
        return res.status(403).json({ error: "Forbidden" });
    }

    console.log("Data ontvangen van Roblox:", data);

    // Discord webhook kan hier
    // fetch("WEBHOOK_URL", {...})

    return res.status(200).json({ success: true });
});

app.listen(PORT, () => {
    console.log(`Server draait op ${PORT}`);
});