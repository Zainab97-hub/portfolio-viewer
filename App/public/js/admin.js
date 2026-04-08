//admin.js
// Importiert den AMapHandler aus der Datei 'amapHandler.js'
import { AMapHandler } from './amapHandler.js';
// Wird ausgeführt, sobald das DOM vollständig geladen ist
document.addEventListener("DOMContentLoaded", async () => {
    new AMapHandler(); // Erstellt eine neue Instanz von AMapHandler
    const token = localStorage.getItem("token");
    // Überprüft, ob ein Token vorhanden ist
    if (!token) {
      
      window.location.href = "/login";
      return;
    }
  
    try {
       // Sendet eine GET-Anfrage an die Admin-API, um Admin-Daten zu laden
      const response = await fetch("/api/admin", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
       // Überprüft, ob die Anfrage nicht erfolgreich war
      if (!response.ok) {
        localStorage.removeItem("token");
        //throw new Error("Failed to fetch profile");
        showPopup("Failed to fetch profile", "error");
      }
  
      const admin = await response.json();
      profileButton.style.display = "block";
      adminButton.style.display = "block";
      logoutButton.style.display = "block";
    } catch (error) {
      alert("Error: " + error.message);
      window.location.href = "/login";
    }
    // Funktion, um ein Popup-Fenster anzuzeigen
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
  