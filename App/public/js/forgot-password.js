//forgot-password.js
// Fügt einen Event-Listener zum Formular für das Zurücksetzen des Passworts hinzu, der auf das Absenden des Formulars reagiert
document.getElementById("forgotPasswordForm").addEventListener("submit", async (event) => {
    event.preventDefault(); // Verhindert die Standardaktion des Formulars (Seiten-Neuladung)
    // Holt die Werte für Name und E-Mail aus den Eingabefelder
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
  
    try {
      // Sendet eine POST-Anfrage an den Endpunkt für das Zurücksetzen des Passworts
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });
  
      const data = await response.json();
      // Überprüft, ob die Anfrage erfolgreich war
      if (response.ok) {
        showPopup(data.message, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      showPopup(error.message, 'error');
    }
  });
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
  