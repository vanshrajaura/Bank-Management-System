const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const port = 3000;
const database = path.join(__dirname, "data.json");

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data.json if it doesn't exist
async function initData() {
    try {
        await fs.access(database);
    } catch {
        await fs.writeFile(database, JSON.stringify([]));
    }
}

// Load data
async function loadData() {
    const data = await fs.readFile(database, "utf8");
    return JSON.parse(data);
}

// Update data
async function updateData(data) {
    await fs.writeFile(database, JSON.stringify(data, null, 4));
}

// Get all data
app.get("/data", async (req, res) => {
    await initData();
    const data = await loadData();
    res.json(data);
});

// Update all data
app.post("/data", async (req, res) => {
    await updateData(req.body);
    res.json({ message: "Data updated successfully" });
});

// Start server
initData().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});