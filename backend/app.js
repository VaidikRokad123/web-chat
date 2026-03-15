import express from "express";
import morgan from "morgan";
import userRoutes from "./src/routes/user.routes.js";

const app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/user", userRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});


export default app;
