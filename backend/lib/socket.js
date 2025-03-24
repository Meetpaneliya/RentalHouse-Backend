import { Server } from "socket.io";
import http from "http";
import express from "express";
import cookieParser from "cookie-parser";
import { socketAuthenticate } from "../middlewares/auth.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:4000", process.env.FRONTEND_URL],
    credentials: true,
  },
});

// Used to store online users as a Map: { userId (string) => socketId }
const userSocketMap = new Map();

export function getReceiverSocketId(user) {
  return userSocketMap.get(user._id.toString());
}

io.use((socket, next) => {
  cookieParser()(
    socket.request,
    socket.request.res || {},
    async (error) => await socketAuthenticate(error, socket, next)
  );
});

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // Expecting socket.user to be set by socketAuthenticate middleware
  const user = {
    _id: socket.user._id,
    name: socket.user.name,
  };
  console.log("User:", user);
  if (user) {
    // Store using stringified user ID
    userSocketMap.set(user._id.toString(), socket.id);
  }

  // Emit list of online users to all connected clients
  io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    if (user) {
      // Delete using the same key (string version)
      userSocketMap.delete(user._id.toString());
    }
    io.emit("getOnlineUsers", Array.from(userSocketMap.keys()));
  });
});

export { io, app, server };
