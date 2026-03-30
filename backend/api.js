const express = require('express');
const app = express();

app.use(express.json());

// 🔹 memory
let lastAnnouncement = null;

// 🔍 health check (HANDIG voor Railway / debugging)
app.get('/', (req, res) => {
    res.send('API is running ✅');
});

// ✅ POST endpoint
app.post('/set-announcement', (req, res) => {
    try {
        const { message, timestamp, author, userId } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'No message provided' });
        }

        lastAnnouncement = {
            message,
            timestamp: timestamp || Date.now(),
            author: author || 'unknown',
            userId: userId || null
        };

        console.log("📢 Announcement opgeslagen:", lastAnnouncement);

        res.status(200).json({ success: true, data: lastAnnouncement });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ✅ GET endpoint
app.get('/last-announcement', (req, res) => {
    if (!lastAnnouncement) {
        return res.status(404).json({ error: 'No announcement found' });
    }

    res.status(200).json(lastAnnouncement);
});

// ❗ fallback route (voorkomt verwarring bij verkeerde routes)
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ API draait op poort ${PORT}`);
});