//visitor.js 
import express from "express"; // Importiert das Express-Framework für die Erstellung von Routern und Handhabung von HTTP-Anfragen.
import { executeQuery } from "../utils/mysql.js"; // Importiert die Funktion executeQuery für den Datenbankzugriff.
import authMiddleware from "./authMiddleware.js"; // Importiert das Authentifizierungsmiddleware zum Schutz der Routen.

const router = express.Router(); // Erstellt einen neuen Express-Router.

// Route: Holt das Benutzerprofil basierend auf der Benutzer-ID
router.get("/", authMiddleware, async (req, res) => {
  const userId = req.user.userId;

  try {
    const results = await executeQuery(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [userId]
    );

    if (results.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = results[0];
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Route: Holt Portfolio-Daten basierend auf dem Jahr
router.get('/data/year/:year', authMiddleware, async (req, res) => {
  const { year } = req.params;
  const query = `
    SELECT 
      p.id, p.work, p.description, p.latitude, p.longitude, y.year,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role,
      i.image_url, 
      v.video_url, 
      pdf.pdf_url, 
      b.panorama_url,
      a.audio_url,
      url.url,
      o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN years y ON p.year_id = y.id
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN url ON p.id = url.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
    WHERE y.year = ?
  `;

  try {
    const results = await executeQuery(query, [year]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching portfolios:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Holt alle Portfolio-Daten 
router.get('/data', authMiddleware, async (req, res) => {
  const query = `
    SELECT 
      p.id, p.work, p.description, p.latitude, p.longitude, y.year,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role,
      i.image_url, 
      v.video_url, 
      pdf.pdf_url, 
      b.panorama_url,
      a.audio_url,
      url.url,
      o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN years y ON p.year_id = y.id
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN url ON p.id = url.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
  `;

  try {
    const results = await executeQuery(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching portfolios:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Holt alle Pins für einen bestimmten Benutzer
router.get('/user/:userId/pins', authMiddleware, async (req, res) => {
  const { userId } = req.params;
  const query = `
    SELECT 
      p.id, p.work, p.description, p.latitude, p.longitude, y.year,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role,
      i.image_url, 
      v.video_url, 
      pdf.pdf_url, 
      b.panorama_url,
      a.audio_url,
      url.url,
      o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN years y ON p.year_id = y.id
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN url ON p.id = url.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
    WHERE u.id = ?
  `;

  try {
    const results = await executeQuery(query, [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching pins for user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Holt alle Benutzer, die Portfolios erstellt haben
router.get('/users-with-works', authMiddleware, async (req, res) => {
  const query = `
    SELECT DISTINCT u.id, u.name 
    FROM users u
    INNER JOIN portfolios p ON u.id = p.user_id
  `;

  try {
    const results = await executeQuery(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching users with works:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Holt alle Jahre
router.get('/years', authMiddleware, async (req, res) => {
  const query = 'SELECT id, year FROM years ORDER BY year';

  try {
    const results = await executeQuery(query);
    res.json(results.map(result => result.year));
  } catch (err) {
    console.error('Error fetching years:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Überprüft, ob ein bestimmtes Jahr existiert
router.get('/check-year/:year', authMiddleware, async (req, res) => {
  const { year } = req.params;
  const query = 'SELECT COUNT(*) as count FROM years WHERE year = ?';

  try {
    const results = await executeQuery(query, [year]);
    res.json({ exists: results[0].count > 0 });
  } catch (err) {
    console.error('Error checking year:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Überprüft, ob ein bestimmter Benutzername existiert
router.get('/check-name/:name', authMiddleware, async (req, res) => {
  const { name } = req.params;
  const query = 'SELECT COUNT(*) as count FROM users WHERE name = ?';

  try {
    const results = await executeQuery(query, [name]);
    res.json({ exists: results[0].count > 0 });
  } catch (err) {
    console.error('Error checking name:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Überprüft, ob eine bestimmte Beschreibung in Portfolios existiert
router.get('/check-description/:description', authMiddleware, async (req, res) => {
  const { description } = req.params;
  const query = 'SELECT COUNT(*) as count FROM portfolios WHERE description LIKE ?';

  try {
    const results = await executeQuery(query, [`%${description}%`]);
    res.json({ exists: results[0].count > 0 });
  } catch (err) {
    console.error('Error checking description:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Überprüft, ob ein bestimmter Titel existiert
router.get('/check-title/:title', authMiddleware, async (req, res) => {
  const { title } = req.params;
  const query = 'SELECT COUNT(*) as count FROM portfolios WHERE work = ?';

  try {
    const results = await executeQuery(query, [title]);
    res.json({ exists: results[0].count > 0 });
  } catch (err) {
    console.error('Error checking title:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Holt Suchvorschläge basierend auf dem Titel
router.get('/search-suggestions', authMiddleware, async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query is required for search suggestions' });
  }

  const searchQuery = `
    SELECT p.work 
    FROM portfolios p
    WHERE p.work LIKE ?
    LIMIT 10
  `;

  try {
    const results = await executeQuery(searchQuery, [`%${query}%`]);
    res.json(results.map(result => result.work));
  } catch (err) {
    console.error('Error fetching search suggestions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Sucht Portfolios nach Titel
router.get('/search', authMiddleware, async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ message: 'Title is required for search' });
  }

  const query = `
    SELECT 
      p.id, p.work, p.description, p.latitude, p.longitude, y.year,
      u.id as user_id, u.name as user_name, u.email as user_email, u.role as user_role,
      i.image_url, 
      v.video_url, 
      pdf.pdf_url, 
      b.panorama_url,
      a.audio_url,
      url.url,
      o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN users u ON p.user_id = u.id
    LEFT JOIN years y ON p.year_id = y.id
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN url ON p.id = url.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
    WHERE p.work LIKE ?
  `;

  try {
    const results = await executeQuery(query, [`%${title}%`]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No portfolios found matching the title' });
    }
    res.json(results);
  } catch (err) {
    console.error('Error fetching portfolios:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

 // Exportiert den Router, damit er in anderen Teilen der Anwendung verwendet werden kann.
export default router; 

