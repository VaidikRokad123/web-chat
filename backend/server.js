import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import connectDB from "./src/db/db.js";
import { Server } from "socket.io";
import { setupSocket } from "./src/socket.js";

dotenv.config();
connectDB();


const port = process.env.PORT || 6969;

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "http://localhost:5173", credentials: true }
});
setupSocket(io);


server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server is running on http://localhost:${port}`);
});
