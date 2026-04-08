//profile.js 
import express from "express"; // Importiert das Express-Framework, um Routen zu erstellen.
import { executeQuery, validatePassword, hashPassword } from "../utils/mysql.js"; // Importiert die Funktionen für SQL-Abfragen, Passwort-Validierung und Passwort-Hashing.
import authMiddleware from "./authMiddleware.js"; // Importiert das Authentifizierungs-Middleware, um den Benutzer zu überprüfen.

const router = express.Router(); // Erstellt einen neuen Router.
// Route: Holt das Profil des Benutzers
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const results = await executeQuery(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User nicht gefunden" });
    }

    const user = results[0];
    res.json(user);
  } catch (err) {
    console.error("Fehler beim Abrufen des Profils:", err);
    res.status(500).json({ message: "Server Fehler" });
  }
});
// Route: Ändert das Passwort des Benutzers
router.post("/change-password", authMiddleware, async (req, res) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Die neuen Passwörter stimmen nicht überein" });
  }

  try {
    const results = await executeQuery(
      "SELECT pwd FROM users WHERE id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User nicht gefunden" });
    }

    const user = results[0];
    const isPasswordValid = await validatePassword(oldPassword, user.pwd);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Das alte Passwort ist nicht korrekt" });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({ message: "Das alte und das neue Passwort dürfen nicht gleich sein" });
    }

    const hashedNewPassword = await hashPassword(newPassword);

    await executeQuery(
      "UPDATE users SET pwd = ? WHERE id = ?",
      [hashedNewPassword, userId]
    );

    res.json({ message: "Passwort erfolgreich geändert" });
  } catch (err) {
    console.error("Fehler beim Ändern des Passworts:", err);
    res.status(500).json({ message: "Server Fehler" });
  }
});

export default router; // Exportiert den Router, damit er in anderen Teilen der Anwendung verwendet werden kann.

