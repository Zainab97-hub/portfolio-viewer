//studentMiddleware.js

// Importiert das jwt-Modul, um JSON-Web-Tokens zu verarbeiten
import jwt from "jsonwebtoken";
// Middleware-Funktion zur Überprüfung der Student-Berechtigung
const studentMiddleware = (req, res, next) => {
  // Holt den Authorization-Header aus der Anfrage
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);
  // Extrahiert das Token aus dem Header, wenn es vorhanden ist
  const token = authHeader && authHeader.split(" ")[1];
  // Überprüft, ob ein Token vorhanden ist
  if (!token) {
    console.log("Token missing");
    // Gibt einen 401-Statuscode zurück, wenn kein Token vorhanden ist
    return res.status(401).json({ logout: true, message: "Token is missing" });
  }

  try {
    // Überprüft das Token mit dem geheimen Schlüssel
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Speichert die entschlüsselten Benutzerdaten in req.user
    // Überprüft, ob die Rolle des Benutzers "student" ist
    if(decoded.role !== "student") return next(new Error("Not Allowed"));
    next();  // Setzt die Ausführung der nächsten Middleware fort, wenn der Benutzer ein Student ist
  } catch (error) {
    console.log("Invalid token");
    res.status(401).json({ logout: true, message: "Invalid token" }); // Gibt einen 401-Statuscode zurück, wenn das Token ungültig ist
  }
};

export default studentMiddleware; // Exportiert die studentMiddleware-Funktion