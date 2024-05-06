import express from "express";
import http from "http";
import { Server as SocketServer } from "socket.io";
import log from "@ajar/marker";

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, {
	cors: {
		origin: CLIENT_URL,
	},
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.status(200).send("Chat Server is up and running");
});

io.on("connection", (socket) => {
	log.info(`Client connected: ${socket.id}`);
	const shortId = socket.id.substring(0, 4);

	socket.on("typing", ({ room }) => {
		socket.to(room).emit("user_is_typing", { userId: shortId });
		log.info(`${shortId} is typing in room: ${room}`);
	});

	socket.on("stopped-typing", ({ room }) => {
		socket.to(room).emit("user_stopped_typing", { userId: shortId });
		log.info(`${shortId} stopped typing in room: ${room}`);
	});

	// Automatically join the general room
	socket.join("general");
	io.to("general").emit("server-msg", {
		message: `${shortId} has joined the general room`,
	});

	socket.emit("server-msg", { message: `Welcome to the chat, ${shortId}` });

	socket.on("client-msg", ({ message, room }) => {
		io.to(room).emit("server-msg", { message: `${shortId}: ${message}` });
	});

	socket.on("join-room", ({ room }) => {
		socket.join(room);
		io.to(room).emit("server-msg", { message: `${shortId} joined the room` });
		socket.emit("server-msg", {
			message: `Welcome to the ${room} room, ${shortId}.`,
		});
		log.info(`${shortId} joined room: ${room}`);
	});

	socket.on("leave-room", ({ room }) => {
		socket.leave(room);
		io.to(room).emit("server-msg", { message: `${shortId} left the room.` });
		log.info(`${shortId} left room: ${room}`);
	});

	socket.on("disconnect", () => {
		log.info(`Client disconnected: ${shortId}`);
	});
});

server.listen(PORT, () => {
	log.info(`Server listening at http://localhost:${PORT}`);
});
