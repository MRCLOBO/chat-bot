import { Server } from "socket.io";
let ioInstance = null;

const apiUrls = process.env.API_URLS.split(",");
const ACCEPTED_ORIGINS = apiUrls;

export const initIO = (server) => {
    if (!ioInstance) {
        ioInstance = new Server(server, {
            cors: {
                // origin: ACCEPTED_ORIGINS,
                origin: "*",
                methods: ["GET", "POST"],
            },
        });
    }
    return ioInstance;
};

export const getIO = () => {
    if (!ioInstance) {
        throw new Error(
            "Socket.IO no ha sido inicializado. Llama a initIO primero."
        );
    }
    return ioInstance;
};
