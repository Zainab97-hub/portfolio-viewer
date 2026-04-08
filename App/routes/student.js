//student.js
import express from "express"; // Importiert das Express-Framework, um Routen zu erstellen.
import { executeQuery } from "../utils/mysql.js"; // Importiert die Funktion executeQuery, um SQL-Abfragen auszuführen.
import studentMiddleware from "../middlewares/studentMiddleware.js"; // Importiert die Middleware, um zu überprüfen, ob der Benutzer ein Student ist.
import multer from 'multer'; // Importiert Multer, um Dateiuploads zu verwalten.
import path from 'path'; // Importiert das Path-Modul, um mit Dateipfaden zu arbeiten.
import fs from 'fs'; // Importiert das File-System-Modul, um mit dem Dateisystem zu interagieren.
import { fileURLToPath } from 'url'; // Importiert, um den Dateipfad aus der URL zu extrahieren.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const deleteFile = (filePath) => {
  if (!filePath || filePath.startsWith('/uploads/default')) {
    console.warn(`Skipping deletion of default or empty file path: ${filePath}`);
    return;
  }

  const fullPath = path.join(__dirname, '..', 'public', filePath);

  fs.access(fullPath, fs.constants.F_OK, (err) => {
    if (err) {
      console.warn(`File does not exist, skipping deletion: ${fullPath}`);
      return;
    }

    fs.unlink(fullPath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${fullPath}`, err);
      } else {
        console.log(`Successfully deleted file: ${fullPath}`);
      }
    });
  });
};


const upload = multer({ storage: storage });

const router = express.Router();
// Route: Holt das Profil des Studenten
router.get("/", studentMiddleware, async (req, res) => {
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
    user.userId = userId;
    res.json(user);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// Route: Holt alle verfügbaren Jahre
router.get('/years', studentMiddleware, async (req, res) => {
  const query = 'SELECT id, year FROM years ORDER BY year';

  try {
    const results = await executeQuery(query);
    res.json(results.map(result => result.year));
  } catch (err) {
    console.error('Error fetching years:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route: Holt alle Portfolios mit den zugehörigen Daten
router.get('/data', studentMiddleware, async (req, res) => {
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

// Route: Holt Portfolios nach Jahr mit den zugehörigen Daten
router.get('/data/year/:year', studentMiddleware, async (req, res) => {
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

// Route: Holt die Pins für einen bestimmten Benutzer
router.get('/user/:userId/pins', studentMiddleware, async (req, res) => {
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

// Route: Überprüft, ob ein Jahr existiert
router.get('/check-year/:year', studentMiddleware, async (req, res) => {
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


// Route: Überprüft, ob ein Pin Daten enthält
router.get('/check-pin-data/:id', studentMiddleware, async (req, res) => {
  const { id } = req.params;
  const query = `
    SELECT 
      p.id, i.image_url, v.video_url, pdf.pdf_url, b.panorama_url, a.audio_url, url.url, o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN url ON p.id = url.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
    WHERE p.id = ?
  `;

  try {
    const results = await executeQuery(query, [id]);
    const hasData = results.length > 0 && (
      results[0].image_url || results[0].video_url || results[0].pdf_url || results[0].panorama_url || results[0].audio_url || results[0].url
    );
    res.json({ hasData });
  } catch (err) {
    console.error('Error checking pin data:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Fügt ein Jahr hinzu
router.post('/add-year', studentMiddleware, async (req, res) => {
  const { year } = req.body;

  const checkQuery = 'SELECT * FROM years WHERE year = ?';
  const insertQuery = 'INSERT INTO years (year) VALUES (?)';

  try {
    const results = await executeQuery(checkQuery, [year]);
    if (results.length > 0) {
      return res.status(400).json({ message: 'Year already exists for this user' });
    }
    await executeQuery(insertQuery, [year]);
    res.json({ success: true, message: 'Year added successfully' });
  } catch (err) {
    console.error('Error adding year:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Holt die Jahr-ID basierend auf dem Jahr
router.get('/get-year-id/:year', studentMiddleware, async (req, res) => {
  const { year } = req.params;
  const query = 'SELECT id FROM years WHERE year = ?';

  try {
    const results = await executeQuery(query, [year]);
    if (results.length === 0) {
      return res.status(404).json({ message: 'Year not found for this user' });
    }
    res.json({ year_id: results[0].id });
  } catch (err) {
    console.error('Error fetching year_id:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Fügt einen neuen Pin hinzu
router.post('/add-pin/:userId', studentMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'panorama', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'ThreeDObject', maxCount: 1 }
]), async (req, res) => {
  const { work, description, latitude, longitude, year_id, userId, url } = req.body;
  const image_url = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : null;
  const video_url = req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : null;
  const pdf_url = req.files['pdf'] ? `/uploads/${req.files['pdf'][0].filename}` : null;
  const panorama_url = req.files['panorama'] ? `/uploads/${req.files['panorama'][0].filename}` : null;
  const audio_url = req.files['audio'] ? `/uploads/${req.files['audio'][0].filename}` : null;
  const ThreeDObject_url = req.files['ThreeDObject'] ? `/uploads/${req.files['ThreeDObject'][0].filename}` : null;

  // Validate userId and year_id
  if (!userId || isNaN(parseInt(userId)) || !year_id || isNaN(parseInt(year_id))) {
    return res.status(400).json({ message: 'Valid userId and year_id are required' });
  }

  try {
    console.log(`Checking year_id: ${year_id}`);
    const yearResults = await executeQuery('SELECT id FROM years WHERE id = ?', [parseInt(year_id)]);
    if (yearResults.length === 0) {
      console.log(`year_id ${year_id} does not exist in the years table.`);
      return res.status(400).json({ message: 'Invalid year_id' });
    }

    console.log(`Inserting into portfolios: ${work}, ${description}, ${latitude}, ${longitude}, ${userId}, ${year_id}`);
    const portfolioResult = await executeQuery(
      "INSERT INTO portfolios (work, description, latitude, longitude, user_id, year_id) VALUES (?, ?, ?, ?, ?, ?)",
      [work, description, latitude, longitude, parseInt(userId), parseInt(year_id)]
    );

    const workId = portfolioResult.insertId;
    const queries = [];

    if (image_url) {
      queries.push(executeQuery('INSERT INTO image (work_id, image_url) VALUES (?, ?)', [workId, image_url]));
    }
    if (video_url) {
      queries.push(executeQuery('INSERT INTO video (work_id, video_url) VALUES (?, ?)', [workId, video_url]));
    }
    if (pdf_url) {
      queries.push(executeQuery('INSERT INTO pdf (work_id, pdf_url) VALUES (?, ?)', [workId, pdf_url]));
    }
    if (panorama_url) {
      queries.push(executeQuery('INSERT INTO panorama (work_id, panorama_url) VALUES (?, ?)', [workId, panorama_url]));
    }
    if (audio_url) {
      queries.push(executeQuery('INSERT INTO audio (work_id, audio_url) VALUES (?, ?)', [workId, audio_url]));
    }
    if (ThreeDObject_url) {
      queries.push(executeQuery('INSERT INTO ThreeDObject (work_id, ThreeDObject_url) VALUES (?, ?)', [workId, ThreeDObject_url]));
    }
    if (url) {
      queries.push(executeQuery('INSERT INTO url (work_id, url) VALUES (?, ?)', [workId, url]));
    }

    await Promise.all(queries);
    res.json({ success: true, workId });
  } catch (err) {
    console.error('Error adding pin:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Route: Bearbeitet einen bestehenden Pin
router.put('/edit-pin/:id', studentMiddleware, upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'video', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'panorama', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'ThreeDObject', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const { work, description, latitude, longitude, userId, url, year_id } = req.body;

  const image_url = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : req.body.currentImage;
  const video_url = req.files['video'] ? `/uploads/${req.files['video'][0].filename}` : req.body.currentVideo;
  const pdf_url = req.files['pdf'] ? `/uploads/${req.files['pdf'][0].filename}` : req.body.currentPdf;
  const panorama_url = req.files['panorama'] ? `/uploads/${req.files['panorama'][0].filename}` : req.body.currentFile360;
  const audio_url = req.files['audio'] ? `/uploads/${req.files['audio'][0].filename}` : req.body.currentAudio;
  const ThreeDObject_url = req.files['ThreeDObject'] ? `/uploads/${req.files['ThreeDObject'][0].filename}` : req.body.currentThreeDObject;

  console.log(`Updating pin with id: ${id}`);

  const portfolioQuery = `
    UPDATE portfolios SET work = ?, description = ?, latitude = ?, longitude = ?, user_id = ?, year_id = ?
    WHERE id = ?`;

  try {
    await executeQuery(portfolioQuery, [work, description, latitude, longitude, userId, year_id, id]);

    const deleteFile = (filePath) => {
      if (filePath && !filePath.startsWith('/uploads/default')) { // Avoid deleting default images
        fs.unlink(path.join(__dirname, '..', 'public', filePath), (err) => {
          if (err) console.error(`Error deleting file: ${filePath}`, err);
        });
      }
    };

    const updateOrInsert = async (table, work_id, url, currentUrl, column) => {
      if (url !== currentUrl) {
        deleteFile(currentUrl); // Delete the old file
        await executeQuery(`DELETE FROM ${table} WHERE work_id = ?`, [work_id]);
        await executeQuery(`INSERT INTO ${table} (work_id, \`${column}\`) VALUES (?, ?)`, [work_id, url]);
      } else {
        await executeQuery(
          `INSERT INTO ${table} (work_id, \`${column}\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`${column}\` = VALUES(\`${column}\`)`,
          [work_id, url]
        );
      }
    };

    const queries = [];
    if (image_url) {
      queries.push(updateOrInsert('image', id, image_url, req.body.currentImage, 'image_url'));
    }
    if (video_url) {
      queries.push(updateOrInsert('video', id, video_url, req.body.currentVideo, 'video_url'));
    }
    if (pdf_url) {
      queries.push(updateOrInsert('pdf', id, pdf_url, req.body.currentPdf, 'pdf_url'));
    }
    if (panorama_url) {
      queries.push(updateOrInsert('panorama', id, panorama_url, req.body.currentFile360, 'panorama_url'));
    }
    if (audio_url) {
      queries.push(updateOrInsert('audio', id, audio_url, req.body.currentAudio, 'audio_url'));
    }
    if (ThreeDObject_url) {
      queries.push(updateOrInsert('ThreeDObject', id, ThreeDObject_url, req.body.currentThreeDObject, 'ThreeDObject_url'));
    }
    if (url) {
      queries.push(updateOrInsert('url', id, url, req.body.currentUrl, 'url'));
    }

    await Promise.all(queries);
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating related data:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Route: Löscht ein Portfolio und die zugehörigen Dateien
router.delete('/delete-pin/:id', studentMiddleware, async (req, res) => {
  const { id } = req.params;

  const getFileUrlsQuery = `
    SELECT 
      i.image_url, 
      v.video_url, 
      pdf.pdf_url, 
      b.panorama_url,
      a.audio_url,
      o.ThreeDObject_url
    FROM portfolios p
    LEFT JOIN image i ON p.id = i.work_id
    LEFT JOIN video v ON p.id = v.work_id
    LEFT JOIN pdf ON p.id = pdf.work_id
    LEFT JOIN panorama b ON p.id = b.work_id
    LEFT JOIN audio a ON p.id = a.work_id
    LEFT JOIN ThreeDObject o ON p.id = o.work_id
    WHERE p.id = ?`;

  try {
    const fileResults = await executeQuery(getFileUrlsQuery, [id]);

    fileResults.forEach(file => {
      deleteFile(file.image_url);
      deleteFile(file.video_url);
      deleteFile(file.pdf_url);
      deleteFile(file.panorama_url);
      deleteFile(file.audio_url);
      deleteFile(file.ThreeDObject_url);
    });

    const deletePortfolioQuery = 'DELETE FROM portfolios WHERE id = ?';
    const deleteUrlQuery = 'DELETE FROM url WHERE work_id = ?';
    
    await executeQuery(deletePortfolioQuery, [id]);
    await executeQuery(deleteUrlQuery, [id]);

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting portfolio:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Route: Holt Suchvorschläge basierend auf dem Titel
router.get('/search-suggestions', studentMiddleware, async (req, res) => {
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
router.get('/search', studentMiddleware, async (req, res) => {
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

// Route: Überprüft, ob ein Titel existiert
router.get('/check-title/:title', studentMiddleware, async (req, res) => {
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
// Route: Holt alle Benutzer, die mit Portfolios verknüpft sind
router.get('/users-with-works', studentMiddleware, async (req, res) => {
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

export default router; // Exportiert den Router, damit er in anderen Teilen der Anwendung verwendet werden kann.
