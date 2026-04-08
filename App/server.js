//server.js
import dotenv from "dotenv"; // Importiert dotenv, um Umgebungsvariablen aus einer .env-Datei zu laden.
import express from "express"; // Importiert das Express-Framework, um den Server zu erstellen.
import cors from "cors"; // Importiert CORS, um Cross-Origin-Anfragen zu ermöglichen.
import path from "path"; // Importiert das Pfadmodul, um Dateipfade zu verarbeiten.
import { fileURLToPath } from "url"; // Importiert diese Funktion, um Dateipfade aus URL-Objekten zu extrahieren.
import authRoutes from "./routes/auth.js"; // Importiert die Authentifizierungsrouten.
import usersRouter from "./routes/users.js"; // Importiert die Benutzer-Routen.
import profileRoute from "./routes/profile.js"; // Importiert die Profil-Routen.
import visitor from "./routes/visitor.js"; // Importiert die Besucher-Routen.
import admin from "./routes/admin.js"; // Importiert die Admin-Routen.
import student from "./routes/student.js"; // Importiert die Studenten-Routen.
import authMiddleware from "./routes/authMiddleware.js"; // Importiert das Authentifizierungsmiddleware.
import "./utils/mysql.js"; // Lädt die MySQL-Verbindung.
import { validateResetTokenForPage } from "./routes/auth.js"; // Importiert die Funktion zur Validierung des Reset-Tokens.
import jwt from "jsonwebtoken"; // Importiert das JSON Web Token-Paket zur Token-Verifizierung.

dotenv.config(); // Lädt die Umgebungsvariablen aus der .env-Datei.

const app = express(); // Erstellt eine Express-Anwendung.
const PORT = process.env.PORT; // Setzt den Port aus den Umgebungsvariablen.

const __filename = fileURLToPath(import.meta.url); // Ermittelt den Dateinamen der aktuellen Datei.
const __dirname = path.dirname(__filename); // Ermittelt das Verzeichnis der aktuellen Datei.

app.use(cors()); // Aktiviert CORS für alle Anfragen.
app.use(express.json()); // Aktiviert JSON-Parsing für eingehende Anfragen.
app.use((req, res, next) => {
  // Fügt Cache-Control-Header hinzu, um das Caching zu verhindern.
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

// Funktion, um zu prüfen, ob der Benutzer berechtigt ist.
function userIsAllowed(req, callback) {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader);

  if (!authHeader) {
    // Wenn kein Autorisierungs-Header vorhanden ist, verweigert Zugriff.
    return callback(false);
  }

  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    console.log("No token");
    return callback(false); // Wenn kein Token vorhanden ist, verweigert Zugriff.
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(`User role: ${decoded.role}`);
    // Überprüft die Benutzerrolle, um den Zugriff zu gewähren.
    if (decoded.role === "admin" || decoded.role === "student" || decoded.role === "visitor") {
      return callback(true); // Erlaubt den Zugriff.
    } else {
      console.log("User role not allowed");
      return callback(false);  // Verweigert Zugriff, wenn die Rolle nicht erlaubt ist.
    }
  } catch (error) {
    console.log("Token verification failed", error);
    return callback(false); // Wenn die Token-Verifizierung fehlschlägt, verweigert Zugriff.
  }
}

// Middleware zum Schutz des Upload-Verzeichnisses
var protectPath = function(regex) {
  return function(req, res, next) {
    if (!regex.test(req.url)) {
      return next(); // Wenn der Pfad nicht passt, geht es zum nächsten Handler.
    }

    userIsAllowed(req, function(allowed) {
      if (allowed) {
        next(); // Wenn der Zugriff erlaubt ist, wird der nächste Handler aufgerufen.
      } else {
        res.status(403).send('You are not allowed!'); // Zugriff verweigert mit Status 403.
      }
    });
  };
};

// Dient statische Dateien aus dem Upload-Verzeichnis mit Schutz
app.use(protectPath(/^\/uploads\/.*$/));
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, "public"))); // Dient alle statischen Dateien aus dem Verzeichnis "public".

// Definiert die API-Routen
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRouter);
app.use("/api/profile", profileRoute);
app.use("/api/visitor", visitor);
app.use("/api/admin", admin);
app.use("/api/student", student);

// Routen für verschiedene HTML-Seiten
app.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register.html"));
});

app.get("/profile", (req, res) => {
  app.use(authMiddleware); // Verwendet Middleware, um den Zugriff auf die Profilseite zu schützen.
  res.sendFile(path.join(__dirname, "public", "profile.html"));
});

app.get("/visitor", (req, res) => {
  app.use(authMiddleware);
  res.sendFile(path.join(__dirname, "public", "visitor.html"));
});
app.get("/admin", (req, res) => {
  app.use(authMiddleware);
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});
app.get("/student", (req, res) => {
  app.use(authMiddleware);
  res.sendFile(path.join(__dirname, "public", "student.html"));
});

app.get("/license", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "LICENSE.html"));
});

app.get("/error", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "error.html"));
});

app.get("/forgot-password", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "forgot-password.html"));
});

app.get("/reset-password", validateResetTokenForPage, (req, res) => {
  // Überprüft das Reset-Token vor dem Anzeigen der Seite.
  res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});

app.get("/users-Verwalten", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "userVerwalten.html"));
});

// Startet den Server und hört auf den angegebenen Port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
