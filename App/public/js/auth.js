//auth.js
// Wird ausgeführt, sobald das DOM vollständig geladen ist
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token"); // Ruft das Token aus dem lokalen Speicher ab
  const tokenExpiry = localStorage.getItem("tokenExpiry"); // Ruft das Ablaufdatum des Tokens ab
  // Überprüft, ob ein Token und ein Ablaufdatum vorhanden sind
  if (token && tokenExpiry) {
    const currentTime = new Date().getTime(); // Holt die aktuelle Zeit in Millisekunden
    // Überprüft, ob das Token noch gültig ist
    if (currentTime < tokenExpiry) {
      validateToken(token).then(isValid => {
        if (isValid) {
          // Blendet die Login- und Registrierungsbuttons aus und zeigt Profil- und Logout-Buttons an
          document.getElementById("loginButton").style.display = "none";
          document.getElementById("registerButton").style.display = "none";
          document.getElementById("profileButton").style.display = "inline-block";
          document.getElementById("logoutButton").style.display = "inline-block";
        } else {
          // Wenn das Token ungültig ist, wird der Benutzer abgemeldet und zur Login-Seite weitergeleitet
          logout();
          window.location.href = "/login";
        }
      });
    } else {
      // Wenn das Token abgelaufen ist, wird der Benutzer abgemeldet und zur Login-Seite weitergeleitet
      logout();
      window.location.href = "/login";
    }
  } else {
    // Wenn kein Token vorhanden ist, wird der Benutzer abgemeldet und die Login- und Registrierungsbuttons angezeigt
    logout();
    document.getElementById("loginButton").style.display = "inline-block";
    document.getElementById("registerButton").style.display = "inline-block";
    document.getElementById("profileButton").style.display = "none";
    document.getElementById("logoutButton").style.display = "none";
  }
});
// Funktion zum Abmelden des Benutzers
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenExpiry");
  localStorage.removeItem("userId");
  localStorage.clear();
}
// Funktion zur Validierung des Tokens
async function validateToken(token) {
  try {
    // Sendet eine POST-Anfrage zur Validierung des Tokens
    const response = await fetch("/api/auth/validate-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Fügt das Token zum Authorization-Header hinzu
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.isValid; // Gibt zurück, ob das Token gültig ist
    } else {
      return false;
    }
  } catch (error) {
    console.error("Token validation error:", error);
    return false;
  }
}
