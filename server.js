import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("stargaze.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS banned_users (
    ip TEXT PRIMARY KEY,
    reason TEXT,
    expires_at DATETIME
  );
`);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // API Routes
  app.get("/api/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages ORDER BY timestamp DESC LIMIT 50").all();
    res.json(messages.reverse());
  });

  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "holdencrediblevr" && password === "Happy61113!") {
      res.json({ success: true, token: "admin-token-123" }); // Simple token for demo
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/admin/ban", (req, res) => {
    const { ip, reason } = req.body;
    // In a real app, we'd check the admin token
    db.prepare("INSERT OR REPLACE INTO banned_users (ip, reason) VALUES (?, ?)").run(ip, reason);
    res.json({ success: true });
  });

  app.get("/api/admin/banned", (req, res) => {
    const banned = db.prepare("SELECT * FROM banned_users").all();
    res.json(banned);
  });

  app.delete("/api/admin/unban/:ip", (req, res) => {
    const { ip } = req.params;
    db.prepare("DELETE FROM banned_users WHERE ip = ?").run(ip);
    res.json({ success: true });
  });

  // WebSocket Chat
  const clients = new Set();

  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress || "unknown";
    
    // Check if banned
    const isBanned = db.prepare("SELECT * FROM banned_users WHERE ip = ?").get(ip);
    if (isBanned) {
      ws.send(JSON.stringify({ type: "error", message: "You are banned." }));
      ws.close();
      return;
    }

    clients.add(ws);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "chat") {
          const { username, text } = message;
          
          // Save to DB
          const stmt = db.prepare("INSERT INTO messages (username, text) VALUES (?, ?)");
          const info = stmt.run(username, text);
          
          const broadcastMsg = JSON.stringify({
            type: "chat",
            id: info.lastInsertRowid,
            username,
            text,
            timestamp: new Date().toISOString()
          });

          for (const client of clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(broadcastMsg);
            }
          }
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
