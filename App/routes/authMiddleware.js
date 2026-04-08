//authMiddleware.js
import jwt from "jsonwebtoken"; // Importiert das JSON Web Token-Paket, um Tokens zu verifizieren.
// Route: Middleware zur Authentifizierung von Benutzern
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("Token missing");
    return res.status(401).json({ logout: true, message: "Token is missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Invalid token");
    res.status(401).json({ logout: true, message: "Invalid token" });
  }
};

export default authMiddleware; // Exportiert die Middleware, damit sie in anderen Teilen der Anwendung verwendet werden kann.
