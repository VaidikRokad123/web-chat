import app from "./app.js";
import dotenv from "dotenv";
import http from "http";
import connectDB from "./src/db/db.js";

connectDB();

dotenv.config();

const port = process.env.PORT || 6969;

const server = http.createServer(app);

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Server is running on http://localhost:${port}`);
});
