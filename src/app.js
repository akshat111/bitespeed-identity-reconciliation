const express = require("express");
const cors = require("cors");
require("dotenv").config();

const healthRoutes = require("./routes/healthRoutes");
const identifyRoutes = require("./routes/identifyRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", healthRoutes);
app.use("/identify", identifyRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal Server Error" });
});

module.exports = app;
