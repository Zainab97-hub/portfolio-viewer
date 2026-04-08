// navigation.js 
// Öffnet die Seitenleiste, indem die Breite auf 400px gesetzt wird
function openNav() {
  document.getElementById("mySidenav").style.width = "400px";
  document.getElementById("mySidenav").style.zIndex = "10"; // Setzt die Z-Index-Eigenschaft, um die Sichtbarkeit zu beeinflussen
  document.getElementById("mySidenav").style.zIndex = "4000"; // Setzt einen höheren Z-Index, damit die Seitenleiste im Vordergrund bleibt
}
// Schließt die Seitenleiste, indem die Breite auf 0 gesetzt wird
function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}
// Event-Listener für Klicks im Fenster
window.onclick = function (event) {
  // Überprüft, ob das angeklickte Element kein Dropdown-Menü-Element ist
  if (!event.target.matches(".sidenav span")) {
     // Holt alle Dropdown-Inhalte
    const dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      const openDropdown = dropdowns[i];
      // Entfernt die "show"-Klasse, wenn sie vorhanden ist
      if (openDropdown.classList.contains("show")) {
        openDropdown.classList.remove("show");
      }
    }
  }
};
// Event-Listener für Klicks im Dokument
document.addEventListener("click", (event) => {
  // Überprüft, ob auf den Button oder die Seitenleiste geklickt wurde
  // Klick auf den Button oder  Klick auf die Seitenleiste
  if (
    document.getElementById("nbtn").contains(event.target) ||
    document.getElementById("mySidenav").contains(event.target)
  ) {
    return; // Bricht ab, damit die Seitenleiste nicht geschlossen wird
  }
  closeNav(); // Schließt die Seitenleiste, wenn außerhalb geklickt wird
});
