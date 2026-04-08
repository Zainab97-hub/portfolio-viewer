//rest-password.js
// Event-Listener für das Absenden des Formulars
document.getElementById("resetPasswordForm").addEventListener("submit", async (event) => {
    event.preventDefault();  // Verhindert das automatische Neuladen der Seite beim Absenden des Formulars
    // Extrahiert das Token aus der URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    // Holt die Eingaben für das neue Passwort und die Bestätigung
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;
  
    try {
       // Sendet eine Anfrage an den Server, um das Passwort zurückzusetzen
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
         // Überträgt das Token und die Passwörter im Anfragekörper
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
  
      const data = await response.json();
      if (response.ok) {
        showPopup(data.message, 'success');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      showPopup(error.message, 'error');
    }
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
  