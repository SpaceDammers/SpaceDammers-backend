import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";

dotenv.config({path: __dirname + '/.env'});

const app: Express = express();
const port = process.env.PORT || 4000;
const SpaceDammersFrontendDomain = process.env.SPACE_DAMMERS_FRONTEND_DOMAIN || "http://localhost:3000";
const httpServer = createServer(app);
const io = new Server(httpServer, {
    allowEIO3: true,
    cors: {
        methods: ["GET", "POST"],
        credentials: true,
        origin: ['http://localhost:3000', SpaceDammersFrontendDomain]
    },
});

// When a user connects to the server
io.on("connection", (socket) => {
    console.log("Socket.io user with id:", socket.id, "connected");

    socket.on("disconnect", () => {
        socket.emit(`disconnected`)
        console.log("Socket.io user with id:", socket.id, "disconnected");
    });
});

// When a user joins a room
io.on("connection", function (socket) {
    socket.on("join", function (roomName: string) {
        // If the room name is not a string, or is an empty string don't let the user join
        if (roomName === undefined || roomName === null || roomName === "") {
            socket.emit("invalidRoomName", roomName);
            console.log("Socket.io user with id:", socket.id, "tried to join invalid room:", roomName);
            return false;
        } else {
            const lowerCaseRoomName = roomName.toLowerCase();
            const room = io.sockets.adapter.rooms.get(lowerCaseRoomName);

            // If there are 2 users in the room, don't let a third user join
            // if (room && room.size > 2) {
            //     socket.emit("full", lowerCaseRoomName);
            //     console.log("Socket.io user with id:", socket.id, "tried to join full room:", lowerCaseRoomName);
            //     return false;
            // } else if (room && room.size === 1 || room && room.size === 0) {
            //     socket.join(lowerCaseRoomName);
            //     socket.emit("joined", lowerCaseRoomName);
            //     console.log("Socket.io user with id:", socket.id, "joined room:", lowerCaseRoomName);
            //     return true;
            // } else if (room === undefined) {
                socket.join(lowerCaseRoomName);
                socket.emit("joined", lowerCaseRoomName);
                console.log("Socket.io user with id:", socket.id, "created room:", lowerCaseRoomName);
                return true;
            // }
        }
    });
});

// When a user sends a message
io.on("connection", function (socket) {
    socket.on("message", function (message: string, roomName: string, userName: string) {
        console.log(`Message received: '${message}' in room '${roomName}' from user '${userName}'`);
        socket.broadcast.emit('message', { id: socket.id, msg: message });
        // socket.to(roomName).emit('message', message, roomName, userName);
        // console.log("Socket.io user with id:", socket.id, "sent message:", message, "to room:", roomName);
    });
});

// When a user presses the reset button
io.on("connection", function (socket) {
    socket.on("reset", () => { 
        socket.broadcast.emit("reset")

        socket.broadcast.emit('message', {
            id: "server",
            msg: "Het bord is gereset"
        });

        console.log("serverside reset");
    })
});

io.on("connection", function (socket) {
    socket.on("play", checkerpieces => {
        socket.broadcast.emit("play", checkerpieces);
    })
}); 

// Webclient backend
app.get("/", (req, res) => {
    res.send("Hello World!");
    res.status(200);
});


// Listen to httpServer with give port and host
httpServer.listen(port, () => {
    console.log(`server is listening on localhost:${port}`);
});
