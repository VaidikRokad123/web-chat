import jwt from "jsonwebtoken";
import { redisClient } from "../services/redis.services.js";

const authUser = async (req, res, next) => {
    try {

        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ error: "Unauthorized user" });
        }

        const isBlacklisted = await redisClient.get(token);
        if (isBlacklisted) {

            res.clearCookie("token");
            res.removeHeader("Authorization");
            return res.status(401).json({ error: "tocken blacklisted" });
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decodedToken;
        next();

    } catch (error) {
        console.log(error);
        return res.status(500).json({ error: error.message });
    }
}


export { authUser };
