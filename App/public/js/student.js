//student.js
import { SMapHandler } from './smapHandler.js'; // Importiert die SMapHandler-Klasse, um die Kartenfunktionalität für Studenten zu verwalten.
document.addEventListener("DOMContentLoaded", async () => { // Führt den Code aus, sobald das DOM vollständig geladen ist.
  new SMapHandler(); // Erstellt eine neue Instanz von SMapHandler, um die Karte zu initialisieren.
    const token = localStorage.getItem("token");
    if (!token) {
      
      window.location.href = "/login";
      return;
    }
  
    try {
      const response = await fetch("/api/student", { // Sendet eine GET-Anfrage an die "/api/student"-Route.
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        showPopup("Failed to fetch profile", "error");
      }
  
      const student = await response.json(); // Parst die JSON-Antwort und speichert sie in der Variable 'student'.
      profileButton.style.display = "block"; // Zeigt den Profil-Button an.
      studentButton.style.display = "block"; // Zeigt den Studenten-Button an.
      logoutButton.style.display = "block"; // Zeigt den Logout-Button an.
    } catch (error) {
      alert("Error: " + error.message);
      window.location.href = "/login";
    }
    // Funktion zum Anzeigen von Popup-Meldungen
    function showPopup(message, type = 'info') {
      const popup = document.createElement('div');
      popup.className = `popup popup-${type}`;
      popup.textContent = message;
      document.body.appendChild(popup);
    
      setTimeout(() => {
        popup.style.opacity = 0;
        setTimeout(() => {
          popup.remove();
        }, 300); 
      }, 3000); 
    }
  });
  