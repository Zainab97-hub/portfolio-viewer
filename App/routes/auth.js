// auth.js
import express from "express";  // Importiert das Express-Framework, um Routen zu erstellen.
import jwt from "jsonwebtoken"; // Importiert das JSON Web Token-Paket, um Tokens zu erstellen und zu verifizieren.
import { executeQuery, validatePassword, hashPassword } from "../utils/mysql.js"; // Importiert Funktionen für SQL-Abfragen, Passwortvalidierung und Passwort-Hashing.
import nodemailer from "nodemailer"; // Importiert Nodemailer, um E-Mails zu versenden.

const router = express.Router(); // Erstellt einen neuen Router.

// SMTP-Konfiguration für Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// Route: Benutzer-Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const results = await executeQuery(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (results.length === 0) {
      return res
        .status(401)
        .json({ message: "Email oder Passwort ist falsch" });
    }

    const user = results[0];

    if (user.status !== "active") {
      return res.status(401).json({ message: "Konto ist nicht aktivie" });
    }

    const isMatch = await validatePassword(password, user.pwd);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Email oder Passwort ist falsch" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token, user: { id: user.id } });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Serverfehler" });
  }
});
// Route: Benutzer-Registrierung
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const hashedPassword = await hashPassword(password);

    const results = await executeQuery(
      "INSERT INTO users (name, email, pwd, role, status) VALUES (?, ?, ?, 'visitor', 'inactive')",
      [name, email, hashedPassword]
    );

    const token = jwt.sign(
      { userId: results.insertId, role: "visitor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ success: true, token });
  } catch (err) {
    console.error("Registration error:", err);
    return res.status(500).json({ message: "Serverfehler" });
  }
});
// Route: Token-Validierung
router.post("/validate-token", (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ isValid: false });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    res.json({ isValid: true });
  } catch (err) {
    res.json({ isValid: false });
  }
});
// Route: Holt die Lizenzinformationen (noch nicht implementiert)
router.get("/license", (req, res) => {
});
// Route: Passwort vergessen
router.post("/forgot-password", async (req, res) => {
  const { name, email } = req.body;

  try {
    const results = await executeQuery(
      "SELECT * FROM users WHERE name = ? AND email = ?",
      [name, email]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "Benutzer nicht gefunden" });
    }

    const user = results[0];
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // token im datenbank speichern
    await executeQuery(
      "INSERT INTO password_reset_tokens (user_id, token) VALUES (?, ?)",
      [user.id, token]
    );

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const mailOptions = {
      from: process.env.SMTP_USER,
      to: email,
      subject: "Passwort zurücksetzen",
      text: `Klicken Sie auf den folgenden Link, um Ihr Passwort zurückzusetzen: ${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Fehler beim Senden der E-Mail:", error);
        return res.status(500).json({ message: "Fehler beim Senden der E-Mail" });
      }
      res.json({ message: "E-Mail zum Zurücksetzen des Passworts wurde gesendet" });
    });
  } catch (err) {
    console.error("Fehler beim Abrufen des Benutzers:", err);
    return res.status(500).json({ message: "Server Fehler" });
  }
});

// Middleware: Validiert das Reset-Token für Passwort-Reset
const validateResetToken = async (req, res, next) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Token fehlt" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const results = await executeQuery(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE",
      [token]
    );

    if (results.length === 0) {
      return res.status(400).json({ message: "Ungültiger oder abgelaufener Token" });
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (err) {
    console.error("Ungültiger oder abgelaufener Token:", err);
    res.status(400).json({ message: "Ungültiger oder abgelaufener Token" });
  }
};

// Middleware: Validiert das Reset-Token für die Reset-Passwort-Seite
export const validateResetTokenForPage = async (req, res, next) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Token fehlt');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const results = await executeQuery(
      "SELECT * FROM password_reset_tokens WHERE token = ? AND used = FALSE",
      [token]
    );

    if (results.length === 0) {
      return res.status(400).send('Ungültiger oder abgelaufener Token');
    }

    req.userId = decoded.userId;
    req.token = token;
    next();
  } catch (err) {
    console.error("Ungültiger oder abgelaufener Token:", err);
    res.status(400).send('Ungültiger oder abgelaufener Token');
  }
};
// Route: Passwort zurücksetzen
router.post("/reset-password", validateResetToken, async (req, res) => {
  const { newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Die neuen Passwörter stimmen nicht überein" });
  }

  try {
    const hashedNewPassword = await hashPassword(newPassword);

    await executeQuery(
      "UPDATE users SET pwd = ? WHERE id = ?",
      [hashedNewPassword, req.userId]
    );

    // Markieren Sie das Token als verwendet
    await executeQuery(
      "UPDATE password_reset_tokens SET used = TRUE WHERE token = ?",
      [req.token]
    );

    res.json({ message: "Passwort erfolgreich geändert" });
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Passworts:", err);
    res.status(500).json({ message: "Server Fehler" });
  }
});

export default router; // Exportiert den Router, damit er in anderen Teilen der Anwendung verwendet werden kann.
