const express = require('express');
const app = express();

app.use(express.json());

// 🔹 memory
let lastAnnouncement = null;

// ✅ POST endpoint (BELANGRIJK)
app.post('/set-announcement', (req, res) => {
    const { message, timestamp, author, userId } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'No message' });
    }

    lastAnnouncement = {
        message,
        timestamp,
        author,
        userId
    };

    console.log("📢 Announcement opgeslagen:", lastAnnouncement);

    res.json({ success: true });
});

// ✅ GET endpoint
app.get('/last-announcement', (req, res) => {
    if (!lastAnnouncement) {
        return res.status(404).json({ error: 'No announcement' });
    }

    res.json(lastAnnouncement);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API draait op poort ${PORT}`);
});