const { Server } = require("socket.io");
const firebaseService = require("../services/firebaseService");

let io;

module.exports = {
    init: (server) => {
        io = new Server(server, {
            cors: {
                origin: "*"
            }
        });

        io.on("connection", (socket) => {
            console.log("Client connected:", socket.id);

            socket.on("disconnect", () => {
                console.log("Client disconnected:", socket.id);
            });
        });

        firebaseService.subscribeToChanges((payload) => {
            if (io) {
                io.emit("sensor:new-reading", payload.reading);
                io.emit("dashboard:update", { type: "firebase-realtime-update", room: payload.room });
            }
        });

        return io;
    },
    getIO: () => io
};
