const express = require('express');
const app = express();

app.use(express.json());

// 🔹 memory in API
let lastAnnouncement = null;

// 🔹 endpoint om announcement te zetten (van bot)
app.post('/set-announcement', (req, res) => {
    const { message, timestamp, author, userId } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'No message provided' });
    }

    lastAnnouncement = {
        message,
        timestamp,
        author,
        userId
    };

    console.log("📢 Announcement ontvangen via bot:", lastAnnouncement);

    res.json({ success: true });
});

// 🔹 endpoint om announcement op te halen
app.get('/last-announcement', (req, res) => {
    if (!lastAnnouncement) {
        return res.status(404).json({ error: 'No announcement' });
    }

    res.json(lastAnnouncement);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`✅ API draait op poort ${PORT}`);
});