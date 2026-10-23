require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./src/config/db");
const app = require("./src/app");
const jwt = require("jsonwebtoken");
const User = require("./src/models/User");
const Channel = require("./src/models/Channel");
const Message = require("./src/models/Message");
const { isMember } = require("./src/utils/permissions");

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET", "POST"] },
});
app.set("io", io);

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("username email");
    if (!user) return next(new Error("User not found"));
    socket.user = { id: user._id.toString(), username: user.username };
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  socket.on("channel:join", async (channelId, ack = () => {}) => {
    try {
      const channel = await Channel.findById(channelId);
      if (!channel || !(await isMember(channel.server, socket.user.id))) {
        return ack({ ok: false, message: "You do not have access to this channel." });
      }
      for (const room of socket.rooms) if (room.startsWith("channel:")) socket.leave(room);
      socket.join(`channel:${channelId}`);
      ack({ ok: true });
    } catch {
      ack({ ok: false, message: "Could not join channel." });
    }
  });

  socket.on("message:send", async ({ channelId, content } = {}, ack = () => {}) => {
    try {
      const text = typeof content === "string" ? content.trim() : "";
      if (!text || text.length > 2000) return ack({ ok: false, message: "Messages must be 1–2000 characters." });
      const channel = await Channel.findById(channelId);
      if (!channel || !(await isMember(channel.server, socket.user.id))) {
        return ack({ ok: false, message: "You do not have access to this channel." });
      }
      const message = await Message.create({ channel: channelId, sender: socket.user.id, content: text });
      const populated = await message.populate("sender", "username");
      const payload = {
        _id: populated._id.toString(), channel: channelId,
        sender: { _id: socket.user.id, username: socket.user.username },
        content: populated.content, createdAt: populated.createdAt,
      };
      io.to(`channel:${channelId}`).emit("message:new", payload);
      ack({ ok: true, message: payload });
    } catch {
      ack({ ok: false, message: "Message could not be sent." });
    }
  });

  socket.on("typing:set", async ({ channelId, isTyping } = {}) => {
    if (!channelId || !socket.rooms.has(`channel:${channelId}`)) return;
    socket.to(`channel:${channelId}`).emit("typing:update", {
      channelId, userId: socket.user.id, username: socket.user.username, isTyping: Boolean(isTyping),
    });
  });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => console.log(`MiniDiscord API and Socket.IO listening on port ${PORT}`));
});
