//users.js 
import express from "express"; // Importiert das Express-Framework, um Routen zu erstellen.
import { executeQuery, hashPassword } from "../utils/mysql.js"; // Importiert die executeQuery Funktionen und Passwort-Hashing
import adminMiddleware from "../middlewares/adminMiddleware.js"; // Importiert die Admin-Middleware, um Admin-Zugriff zu überprüfen.

const router = express.Router(); // Erstellt einen neuen Router.

// Route: Holt alle Benutzer (nur für Admins)
router.get("/", adminMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const results = await executeQuery("SELECT * FROM users");
    res.json(results);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).send("Internal Server Error");
  }
});
// Route: Holt alle Benutzer (Alternative Route, nur für Admins)
router.get("/user", adminMiddleware, async (req, res) => {
  try {
      const results = await executeQuery("SELECT * FROM users");
      res.json(results);
  } catch (err) {
      console.error("Error fetching users:", err);
      res.status(500).send("Internal Server Error");
  }
});
// Route: Aktualisiert die Rolle eines Benutzers (nur für Admins)
router.put("/:id/role", adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  try {
      await executeQuery("UPDATE users SET role = ? WHERE id = ?", [role, userId]);
      res.sendStatus(200);
  } catch (err) {
      console.error("Error updating user role:", err);
      res.status(500).send("Internal Server Error");
  }
});
// Route: Aktualisiert den Status eines Benutzers (nur für Admins)
router.put("/:id/status", adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { status } = req.body;
  try {
      await executeQuery("UPDATE users SET status = ? WHERE id = ?", [status, userId]);
      res.sendStatus(200);
  } catch (err) {
      console.error("Error updating user status:", err);
      res.status(500).send("Internal Server Error");
  }
});
// Route: Akzeptiert einen Benutzer und setzt den Status auf 'aktiv' (nur für Admins)
router.put("/:id/accept", adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
      await executeQuery("UPDATE users SET status = 'active' WHERE id = ?", [userId]);
      res.sendStatus(200);
  } catch (err) {
      console.error("Error accepting user:", err);
      res.status(500).send("Internal Server Error");
  }
});
// Route: Löscht einen Benutzer (nur für Admins)
router.delete("/:id", adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  try {
      await executeQuery("DELETE FROM users WHERE id = ?", [userId]);
      res.sendStatus(200);
  } catch (err) {
      console.error("Error deleting user:", err);
      res.status(500).send("Internal Server Error");
  }
});

export default router;  // Exportiert den Router, damit er in anderen Teilen der Anwendung verwendet werden kann.

