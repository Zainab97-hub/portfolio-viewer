//visitor.js
import MapHandler from './mapHandler.js'; // Importiert die MapHandler-Klasse, um die Kartenfunktionalität zu verwalten.
document.addEventListener("DOMContentLoaded", async () => { // Führt den Code aus, sobald das DOM vollständig geladen ist.
  
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/login";
    return;
  }

  try {
    const response = await fetch("/api/visitor", { // Sendet eine GET-Anfrage an die "/api/visitor"-Route.
      method: "GET",
      headers: {
        "Content-Type": "application/json", // Setzt den Header-Typ auf JSON.
        Authorization: `Bearer ${token}`, // Fügt das Token zur Autorisierung im Header hinzu.
      },
    });

    if (!response.ok) {
      showPopup("Failed to fetch profile", "error");
    }

    const visitor = await response.json(); // Parst die JSON-Antwort und speichert sie in der Variable 'visitor'.
    profileButton.style.display = "block"; // Zeigt den Profil-Button an.
    visitorButton.style.display = "block"; // Zeigt den Besucher-Button an.
    logoutButton.style.display = "block"; // Zeigt den Logout-Button an.
  } catch (error) {
    alert("Error: " + error.message);
    window.location.href = "/login";
  }
  new MapHandler(); // Erstellt eine neue Instanz von MapHandler, um die Karte zu initialisieren.
 
  document.getElementById('closeModal').onclick = function () { // Schließt das Modal-Fenster, wenn der Schließen-Button angeklickt wird.
    document.getElementById('modal').style.display = "none";
};
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
