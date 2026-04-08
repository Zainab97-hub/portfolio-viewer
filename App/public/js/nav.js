//nav.js 

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  // Holt die HTML-Elemente für die verschiedenen Buttons
  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");
  const profileButton = document.getElementById("profileButton");
  const visitorButton = document.getElementById("visitorButton");
  const logoutButton = document.getElementById("logoutButton");
  const adminButton = document.getElementById("adminButton");
  const studentButton = document.getElementById("studentButton");
  const verwaltungsButton = document.getElementById("verwaltungsButton");
  // Überprüft, ob ein Token vorhanden ist (d.h. der Benutzer ist eingeloggt)
  if (token) {
     // Versteckt die Login- und Registrierungsbuttons und zeigt andere Buttons an
    loginButton.style.display = "none";
    registerButton.style.display = "none";
    profileButton.style.display = "block";
    visitorButton.style.display = "block"; 
    logoutButton.style.display = "block";
    adminButton.style.display = "block";
    studentButton.style.display = "block";
    // Event-Listener für den Logout-Button
    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    });

    // Check the user role
    fetch("/api/profile", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        // Zeigt oder versteckt Buttons basierend auf der Rolle des Benutzers
        if (data.role == "visitor") {
          visitorButton.style.display = "block";
          adminButton.style.display = "none";
          studentButton.style.display = "none";
          verwaltungsButton.style.display ="none";
        }
        else if(data.role == "admin") {
          adminButton.style.display = "block";
          studentButton.style.display = "none";
          visitorButton.style.display = "block";
          verwaltungsButton.style.display ="block";
        } 
        else if(data.role == "student") {
          studentButton.style.display = "block";
          adminButton.style.display = "none";
          visitorButton.style.display = "block";
          verwaltungsButton.style.display ="none";
        }
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
      });
      // Zweiter Event-Listener für den Logout-Button (falls der Benutzer ausgeloggt werden muss)
      logoutButton.addEventListener("click", () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    });
  }
  // Event-Listener für die Navigation
  document.getElementById('nbtn').addEventListener('click', openNav);
   document.querySelector('.closebtn').addEventListener('click', closeNav);
});
