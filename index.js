const express = require("express");
const app = express();
app.use(express.json());

app.post("/roblox-data", (req, res) => {
  console.log("Data ontvangen:", req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server draait op ${PORT}`));