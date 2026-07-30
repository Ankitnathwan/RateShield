import express from "express";
import MemoryStore from "./stores/MemoryStore.js";

const app = express();
app.use(express.json());

const store = new MemoryStore();

app.get("/", (req, res) => {
    res.json({
        message: "Welcome to RateShield"
    });
});

app.get("/api/test", (req, res) => {
    res.json({
        sucess: true
    });
});

app.get("/memory", (req, res) => {
    store.set("user1", 42);

    res.json({
        value: store.get("user1")
    });
});

export default app;