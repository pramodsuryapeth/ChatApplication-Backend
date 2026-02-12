require("dotenv").config();
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const token =
    req.cookies.token ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;        // full user object
    req.userId = decoded.id;   // direct userId

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
