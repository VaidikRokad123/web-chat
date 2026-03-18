import express from "express";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./src/routes/user.routes.js";
import groupRoutes from "./src/routes/group.routes.js";


const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/user", userRoutes);
app.use("/group", groupRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});


export default app;
