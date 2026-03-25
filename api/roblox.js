// api/roblox.js
export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // Optioneel: check secret key
    const secret = req.headers["authorization"];
    if (secret !== "rnd_QIRlGIxLqqnEcSLDHOqGODtJrWmR") {
        return res.status(403).json({ error: "Forbidden" });
    }

    const data = req.body;

    console.log("Data ontvangen van Roblox:", data);

    // Stuur naar Discord
    // (als je bot online draait en client al ready is)
    // channel.send(...) of via webhook

    return res.status(200).json({ success: true });
}