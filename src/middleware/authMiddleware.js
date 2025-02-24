const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  console.log("Token received:", token);

  if (!token) {
    console.log("No token provided.");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded user:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Invalid token:", error);
    return res.status(401).json({ error: "Invalid token" });
  }
};

module.exports = { authenticate };
