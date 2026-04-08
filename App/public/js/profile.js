// profile.js 
// Event Listener, um Aktionen durchzuführen, sobald die Seite vollständig geladen ist
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    showPopup("Sie sind nicht eingeloggt!", "error");
    window.location.href = "/login";
    return;
  }

  try {
    // Anfrage, um das Profil des Benutzers zu laden
    const response = await fetch("/api/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Token zur Authentifizierung mitsenden
      },
    });

    if (!response.ok) {
      throw new Error("Profil konnte nicht abgerufen werden");
    }

    const profileData = await response.json();
    // Profilinformationen in die entsprechenden HTML-Elemente einfügen
    document.getElementById("user-name").innerText = profileData.name;
    document.getElementById("user-email").innerText = profileData.email;
    document.getElementById("user-role").innerText = profileData.role;
    // Sichtbarkeit der Buttons basierend auf der Benutzerrolle
    if (profileData.role == "visitor") {
      document.getElementById("visitorButton").style.display = "block";
      document.getElementById("adminButton").style.display = "none";
      document.getElementById("studentButton").style.display = "none";
    } else if (profileData.role == "admin") {
        document.getElementById("adminButton").style.display = "block";
        document.getElementById("studentButton").style.display = "none";
        document.getElementById("visitorButton").style.display = "none";
    } else if (profileData.role == "student") {
        document.getElementById("studentButton").style.display = "block";
        document.getElementById("adminButton").style.display = "none";
        document.getElementById("visitorButton").style.display = "none";
    }
  } catch (error) {
    showPopup("Error: " + error.message, "error");
    window.location.href = "/login";
  }

  // Event Listener für das Formular zur Passwortänderung
  document.getElementById("change-password-form").addEventListener("submit", async (event) => {
    event.preventDefault();
     // Holt die Eingabewerte für altes Passwort, neues Passwort und Bestätigung des neuen Passworts
    const oldPassword = document.getElementById("old-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    try {
      // Anfrage, um das Passwort zu ändern
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message);
      }

      showPopup("Passwort erfolgreich geändert!", "success");
      document.getElementById("change-password-form").reset();
    } catch (error) {
      showPopup("Error: " + error.message, "error");
    }
  });
  // Event Listener für den "Abbrechen"-Button im Passwort-Änderungsformular
  document.getElementById("cancel-change-password").addEventListener("click", () => {
    document.getElementById("change-password-form").reset(); // Formular zurücksetzen
    document.getElementById("password-popup").style.display = "none"; // Popup schließen
  });

  // Event Listener für Passwort ändern Button
  document.getElementById("change-password-button").addEventListener("click", () => {
    document.getElementById("password-popup").style.display = "block";
  });

  // Event Listener für Popup schließen
  document.querySelector(".modal .close").addEventListener("click", () => {
    document.getElementById("password-popup").style.display = "none";
  });
  // Funktion zum Anzeigen eines Popups mit einer Nachricht
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
  // Event Listener für einen Button (nicht spezifiziert, aber referenziert im Code)
  document.getElementById('nbtn').addEventListener('click', openNav);
});
