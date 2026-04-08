//login.js
// Fügt einen Event-Listener zum Login-Formular hinzu, der auf das Absenden des Formulars reagiert
document.getElementById("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault(); // Verhindert die Standardaktion des Formulars (Seiten-Neuladung)

  // Holt die Werte für E-Mail und Passwort aus den Eingabefeldern
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
// Sendet eine POST-Anfrage an den Login-Endpunkt der API mit den Anmeldeinformationen
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Setzt den Inhaltstyp auf JSON
    },
    body: JSON.stringify({ email, password }), // Sendet die Anmeldeinformationen im Request-Body
  });
  // Konvertiert die Antwort in ein JSON-Objekt
  const data = await response.json();
  // Überprüft, ob die Anmeldung erfolgreich war
  if (data.success) {
    const expiryTime = new Date().getTime() + 60 * 60 * 1000; // 1 Stunde ab jetzt
    localStorage.setItem("token", data.token); // Speichert das Token im lokalen Speicher
    localStorage.setItem("tokenExpiry", expiryTime);  // Speichert das Ablaufdatum des Tokens
    localStorage.setItem('userId', data.user.id); // Speichert die Benutzer-ID im lokalen Speicher
    window.location.href = "/home"; // Leitet zur Startseite weiter
  } else {
    showPopup(data.message, 'error');
  }
  // Funktion zum Anzeigen einer Popup-Nachricht
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
