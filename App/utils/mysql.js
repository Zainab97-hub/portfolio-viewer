// mysql.js
import mysql from 'mysql2/promise'; // Importiert das MySQL-Modul für die Verwendung mit Promises.
import bcrypt from 'bcryptjs'; // Importiert bcrypt.js, um Passwörter zu hashen und zu überprüfen.
import dotenv from 'dotenv'; // Importiert dotenv, um Umgebungsvariablen aus einer .env-Datei zu laden.

dotenv.config(); // Lädt die Umgebungsvariablen aus der .env-Datei.

const pool = mysql.createPool({
  host: process.env.DB_HOST, // Hostname der Datenbank, aus Umgebungsvariablen geladen.
  user: process.env.DB_USER, // Benutzername der Datenbank, aus Umgebungsvariablen geladen.
  password: process.env.DB_PASSWORD, // Passwort der Datenbank, aus Umgebungsvariablen geladen.
  database: process.env.DB_NAME, // Datenbankname, aus Umgebungsvariablen geladen.
  port: process.env.DB_PORT, // Port der Datenbank, aus Umgebungsvariablen geladen.
  waitForConnections: true, // Wartet auf verfügbare Verbindungen, wenn alle Verbindungen belegt sind.
  connectionLimit: 10, // Maximale Anzahl gleichzeitiger Verbindungen.
  queueLimit: 0, // Maximale Anzahl der Anfragen in der Warteschlange (0 = unbegrenzt).
});

// Überprüft die Verbindung zum Datenbankpool
pool.getConnection()
  .then(connection => {
    console.log("MySQL connected"); // Erfolgreiche Verbindungsmeldung.
    connection.release(); // Gibt die Verbindung zurück in den Pool.
  })
  .catch(err => {
    console.error("MySQL connection error:", err); // Fehlerausgabe, wenn die Verbindung fehlschlägt.
  });

// Hilfsfunktion zum Hashen von Passwörtern
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10); // Hasht das Passwort mit einer Salt-Runde von 10.
};

// Hilfsfunktion zur Überprüfung von Passwörtern
const validatePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword); // Vergleicht das eingegebene Passwort mit dem gehashten Passwort.
};

// Funktion zum Ausführen von Datenbankabfragen
const executeQuery = async (query, params) => {
  try {
    const [results, fields] = await pool.query(query, params); // Führt die SQL-Abfrage mit den angegebenen Parametern aus.
    return results; // Gibt die Ergebnisse der Abfrage zurück.
  } catch (err) {
    console.error('Query execution error:', err); // Gibt einen Fehler aus, wenn die Abfrage fehlschlägt.
    throw err; // Wirft den Fehler zur weiteren Verarbeitung.
  }
};

// Exportiert die Funktionen und den Datenbankpool für die Verwendung in anderen Modulen
export { pool, hashPassword, validatePassword, executeQuery };
