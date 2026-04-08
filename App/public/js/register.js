//register.js
// Event-Listener für das Absenden des Formulars
document
  .getElementById("registerForm")
  .addEventListener("submit", async (event) => {
    event.preventDefault(); // Verhindert das automatische Neuladen der Seite beim Absenden des Formulars

    // Holt die Werte aus den Eingabefeldern für Name, E-Mail und Passwort
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    // Sendet eine POST-Anfrage an den Server, um den Benutzer zu registrieren
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Überträgt die Daten im Anfragekörper als JSON-Objekt
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    // Überprüft, ob die Registrierung erfolgreich war
    if (data.success) {
      showPopup('Registration successful', 'success');      
      window.location.href = "/login";
    } else {
      showPopup(data.message, 'error');
    }
    // Funktion zum Anzeigen eines Popups mit einer Nachricht
    function showPopup(message, type = 'info') {
      const popup = document.createElement('div');
      popup.className = `popup popup-${type}`;
      popup.textContent = message;
      document.body.appendChild(popup);
    
      setTimeout(() => {
        popup.style.opacity = 0; // Fade out
        setTimeout(() => {
          popup.remove();
        }, 300); // Remove after fade out
      }, 3000); // Show for 3 seconds
    }
    
  });
