// userVerwalten.js
document.addEventListener('DOMContentLoaded', async () => {
    // Holt das Token aus dem lokalen Speicher und ruft alle Filter-Elemente für Rollen ab
    const token = localStorage.getItem("token");
    const roleFilters = document.querySelectorAll('.role-filter');

    // Fügt jedem Rollen-Filter ein 'change'-Event hinzu, um die Benutzerliste bei Änderung neu zu laden
    roleFilters.forEach(filter => filter.addEventListener('change', reloadUsers));

    try {
         // Sendet eine GET-Anfrage, um die Liste der Benutzer abzurufen
        const response = await fetch("/api/users/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        // Überprüft, ob die Antwort erfolgreich ist; andernfalls wird der Benutzer ausgeloggt
        if (!response.ok) {
            localStorage.removeItem("token");
            throw new Error("Failed to fetch users");
        }
        // Verarbeitet die Antwort und zeigt die Benutzer in der Tabelle an
        const users = await response.json();
        renderUserTable(users);
    } catch (error) {
        alert("Error: " + error.message);
        window.location.href = "/login";
    }
});
// Funktion zum Rendern der Benutzertabelle
function renderUserTable(users) {
    // Sortiert die Benutzer nach Status (inaktiv zuerst) und Erstellungsdatum
    users.sort((a, b) => {
        if (a.status === 'inactive' && b.status !== 'inactive') {
            return -1;
        } else if (a.status !== 'inactive' && b.status === 'inactive') {
            return 1;
        } else {
            return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    // Filtert die Benutzer basierend auf den ausgewählten Rollen-Filtern
    const roleFilters = document.querySelectorAll('.role-filter:checked');
    const filteredRoles = Array.from(roleFilters).map(filter => filter.value);
    
    if (filteredRoles.length > 0) {
        users = users.filter(user => filteredRoles.includes(user.role));
    }

    const userTableBody = document.querySelector('#userTable tbody');
    userTableBody.innerHTML = ''; // Löscht vorhandene Zeilen in der Tabelle
    // Erzeugt und fügt für jeden Benutzer eine Zeile in die Tabelle ein
    users.forEach(user => {
        const row = document.createElement('tr');
        let actionContent;
        let statusImage;
        // Legt das Status-Icon und die Aktionen basierend auf dem Benutzerstatus fest
        if (user.status === 'inactive') {
            statusImage = `<img src="./images/aufzeichnen_rot.png" alt="Inactive" class="status-image" />`;
            actionContent = `
                <img src="./images/richtig.png" alt="Accept" onclick="acceptUser(${user.id})" />
                <img src="./images/buchstabe-x.png" alt="Reject" onclick="confirmDeleteUser(${user.id})" />
            `;
        } else if (user.status === 'active') {
            statusImage = `<img src="./images/aufzeichnung_gruen.png" alt="Active" class="status-image" />`;
            actionContent = `<img src="./images/loschen.png" alt="Delete" onclick="confirmDeleteUser(${user.id})" />`;
        }
        // Füllt die Zeile mit Benutzerdaten und Aktionen
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${new Date(user.created_at).toLocaleDateString()}</td>
            <td>
                <select onchange="updateRole(${user.id}, this.value)">
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                    <option value="visitor" ${user.role === 'visitor' ? 'selected' : ''}>Besucher</option>
                </select>
            </td>
            <td>
                <select onchange="updateStatus(${user.id}, this.value, this)">
                    <option value="active" ${user.status === 'active' ? 'selected' : ''}>Aktiv</option>
                    <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inaktiv</option>
                </select>
                <span class="status-image-container">${statusImage}</span>
            </td>
            <td class="action-content">
                ${actionContent}
            </td>
        `;
        userTableBody.appendChild(row);
    });
}
// Funktion zum Aktualisieren der Benutzerrolle
function updateRole(userId, newRole) {
    const token = localStorage.getItem("token");
    fetch(`/api/users/${userId}/role`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole })
    })
    .then(() => showPopup('Rolle erfolgreich aktualisiert', 'success'))
    .catch((error) => showPopup('Fehler beim Aktualisieren der Rolle: ' + error.message, 'error'));
}
// Funktion zum Aktualisieren des Benutzerstatus
function updateStatus(userId, newStatus, selectElement) {
    const token = localStorage.getItem("token");
    fetch(`/api/users/${userId}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
    })
    .then(() => {
        showPopup('Status erfolgreich aktualisiert', 'success');
        reloadUsers(); // Fetch and re-render the user table
    })
    .catch((error) => showPopup('Fehler beim Aktualisieren des Status: ' + error.message, 'error'));
}
// Funktion zum Neuladen der Benutzerliste
async function reloadUsers() {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch("/api/users/user", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            throw new Error("Benutzer konnten nicht abgerufen werden");
        }

        const users = await response.json();
        renderUserTable(users);
    } catch (error) {
        alert("Error: " + error.message);
        window.location.href = "/login";
    }
}
// Funktion zum Akzeptieren eines Benutzers
function acceptUser(userId) {
    const token = localStorage.getItem("token");
    fetch(`/api/users/${userId}/accept`, {
        method: 'PUT',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then(() => reloadUsers());
}
// Funktion zum Ablehnen eines Benutzers
function rejectUser(userId) {
    const token = localStorage.getItem("token");
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then(() => reloadUsers());
}
// Funktion zum Bestätigen des Löschens eines Benutzers
function confirmDeleteUser(userId) {
    const confirmPopup = document.getElementById('confirmPopup');
    const confirmMessage = document.getElementById('confirmMessage');
    confirmMessage.innerText = 'Möchten Sie diesen Benutzer wirklich löschen?';

    const confirmYes = document.getElementById('confirmButton');
    const confirmNo = document.getElementById('cancelButton');

    confirmYes.onclick = () => {
        deleteUser(userId);
        confirmPopup.style.display = 'none';
    };
    confirmNo.onclick = () => confirmPopup.style.display = 'none';

    confirmPopup.style.display = 'block';
}
// Funktion zum Löschen eines Benutzers
function deleteUser(userId) {
    const token = localStorage.getItem("token");
    fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    }).then(() => {
        reloadUsers();
        document.getElementById('confirmPopup').style.display = 'none';
    });
}

// Close the confirmation popup when the user clicks outside of it
window.onclick = function(event) {
    const modal = document.getElementById('confirmPopup');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
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
        }, 350);
    }, 3500);
}
