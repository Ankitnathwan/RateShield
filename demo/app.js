import express from "express";
import MemoryStore from "../src/stores/MemoryStore.js";
import rateLimiter from "../src/middleware/rateLimiter.js";

const app = express();

app.use(
    rateLimiter({
        algorithm: "token-bucket",
        capacity: 5,
        refillRate: 1,
    })
);

app.use(express.json());

const store = new MemoryStore();

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to RateShield"
    });
});

app.get("/api/test", (req, res) => {
    res.json({
        success: true
    });
});

app.get("/memory", (req, res) => {
    store.set("user1", 42);

    res.json({
        value: store.get("user1")
    });
});

export default app;