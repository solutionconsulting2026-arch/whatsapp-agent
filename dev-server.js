// Local development server (Vercel uses api/whatsapp.js instead).
// Run: npm run dev  -> POST http://localhost:3000/api/whatsapp
const express = require("express");
const whatsapp = require("./api/whatsapp");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/", (req, res) => res.send("WhatsApp agent router is running 🚀"));
app.all(["/api/whatsapp", "/whatsapp"], whatsapp);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));
