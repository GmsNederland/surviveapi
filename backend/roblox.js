export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const data = req.body;

    // Check secret uit body ipv headers
    if (data.secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
        return res.status(403).json({ error: "Forbidden" });
    }

    console.log("Data ontvangen van Roblox:", data);

    // Hier kan je Discord webhook of bot pingen
    // fetch("WEBHOOK_URL", { method: "POST", body: JSON.stringify({...}) })

    return res.status(200).json({ success: true });
}