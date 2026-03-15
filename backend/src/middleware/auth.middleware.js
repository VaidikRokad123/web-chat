import jwt from "jsonwebtoken";


const authUser = async (req, res, next) => {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
        console.log(token);
        if (!token) {
            return res.status(401).json({ error: "Unauthorized user" });
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
