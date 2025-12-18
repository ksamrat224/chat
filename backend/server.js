import { createServer } from "node:http";
import express from "express";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});
const ROOM = "group";
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.on("joinRoom", async (userName) => {
    console.log(`${userName} joined the chat`);
    await socket.join(ROOM);
    // io.to(ROOM).emit("roomNotice", userName);

    socket.to(ROOM).emit("roomNotice", userName);
  });
});

server.listen(4600, () => {
  console.log("server running at http://localhost:4600");
});
