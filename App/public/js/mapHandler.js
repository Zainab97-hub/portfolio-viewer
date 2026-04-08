//mapHandler.js
export default class MapHandler {
    constructor() {
        // Initialisiert die Karte und die Event-Listener
        let currentImagePath = './images/Ausstellung_v6.png';
        this.map = L.map('map', {
            minZoom: 1,
            maxZoom: 4,
            center: [0, 0],
            zoom: 1,
            crs: L.CRS.Simple
        });

        var w = 250;
        var h = 170;
        var bounds = [[-h, -w], [h, w]];

        this.map.setMaxBounds(bounds);

        L.imageOverlay(currentImagePath, bounds).addTo(this.map);

        this.currentYearSpan = document.getElementById('currentYear');
        this.selectPerson = document.getElementById('selectPerson');
        this.selectYear = document.getElementById('selectYear');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');

        this.markers = [];
        this.markerMap = new Map(); // Map zum Verfolgen der Marker anhand ihrer IDs
        const currentYear = new Date().getFullYear();
        this.initEventListeners();
        this.updateCurrentYear(currentYear);
        this.loadData(currentYear);
        this.currentYearSpan.textContent = currentYear;
        this.loadYears();
        this.loadNames();
    }
    // Initialisiert die Event-Listener
    initEventListeners() {
        document.getElementById('searchQuery').addEventListener('input', this.handleSearchInput.bind(this));
        document.getElementById('searchQuery').addEventListener('keypress', this.handleSearchKeyPress.bind(this));
        this.selectPerson.addEventListener('change', this.handleSelectPerson.bind(this));
        this.selectYear.addEventListener('change', this.handleSelectYear.bind(this));
    }
    // Behandelt Tastatureingaben im Suchfeld (bei "Enter" wird eine Suche ausgeführt)
    handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSearch();
        }
    }
    // Behandelt die Sucheingabe und zeigt Vorschläge an
    async handleSearchInput(event) {
        const query = event.target.value.trim();

        if (!query) {
            this.suggestionsContainer.innerHTML = '';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/visitor/search-suggestions?query=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const suggestions = await response.json();
                console.log('Suggestions:', suggestions);
                this.showSuggestions(suggestions);
            } else {
                console.error('Failed to fetch suggestions');
            }
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }
    // Zeigt die Suchvorschläge an
    showSuggestions(suggestions) {
        this.suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionItem = document.createElement('div');
            suggestionItem.className = 'suggestion-item';
            suggestionItem.textContent = suggestion;
            suggestionItem.addEventListener('click', () => {
                document.getElementById('searchQuery').value = suggestion;
                this.suggestionsContainer.innerHTML = '';
                this.handleSearch();
            });
            this.suggestionsContainer.appendChild(suggestionItem);
        });
    }
    // Behandelt die Auswahl eines Benutzers im Dropdown-Menü
    async handleSelectPerson() {
        const userId = this.selectPerson.value;
        if (userId) {
            this.loadPinsByUser(userId);
        } else {
            this.loadPins();
        }
    }
    // Behandelt die Auswahl eines Jahres im Dropdown-Menü
    async handleSelectYear() {
        const year = this.selectYear.value;
        if (year) {
            this.currentYear = year;
            const hasData = await this.checkYearData(year);
            if (hasData) {
                this.loadPins(year);
            } else {
                this.showPopup('Dieses Jahr enthält noch keine Pins.', 'info');
                this.clearMarkers();
            }
        } else {
            this.loadPins();
        }
    }
    // Überprüft, ob Daten für das ausgewählte Jahr vorhanden sind
    async checkYearData(year) {
        const url = `/api/visitor/data/year/${year}`;
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.status === 404) {
                return false;
            }
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            return data.length > 0;
        } catch (error) {
            console.error('Fehler beim Überprüfen der Jahresdaten:', error);
            this.showPopup('Fehler beim Überprüfen der Jahresdaten', 'error');
            return false;
        }
    }
    // Lädt die Pins für ein bestimmtes Jahr
    async loadPins(year = null) {
        let url = '/api/visitor/data';
        if (year) {
            url += `/year/${year}`;
        }

        this.clearMarkers();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            console.log('Pins geladen:', data);

            this.addMarkersToMap(data);
        } catch (error) {
            console.error('Fehler beim Laden der Pins:', error);
            this.showPopup('Fehler beim Laden der Pins', 'error');
        }
    }
    // Lädt die Pins für einen bestimmten Benutzer
    async loadPinsByUser(userId) {
        const url = `/api/visitor/user/${userId}/pins`;
        this.clearMarkers();

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            const data = await response.json();
            this.addMarkersToMap(data);
        } catch (error) {
            console.error('Fehler beim Laden der Pins:', error);
            this.showPopup('Fehler beim Laden der Pins', 'error');
        }
    }
    // Lädt die Namen der Benutzer mit Werken
    async loadNames() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/visitor/users-with-works', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                data.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    this.selectPerson.appendChild(option);
                });
            } else {
                this.showPopup(`Fehler beim Laden der Namen: ${response.status} ${response.statusText}`, 'error');
            }
        } catch (error) {
            this.showPopup(`Fehler beim Laden der Namen: ${error.message}`, 'error');
        }
    }
    // Lädt die verfügbaren Jahre
    async loadYears() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/visitor/years', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                const allYearsOption = document.createElement('option');
                allYearsOption.value = '';
                allYearsOption.textContent = 'Alle Jahre';
                this.selectYear.appendChild(allYearsOption);
                data.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    this.selectYear.appendChild(option);
                });
            } else {
                this.showPopup('Fehler beim Laden der Jahre', 'error');
            }
        } catch (error) {
            this.showPopup('Fehler beim Laden der Jahre', 'error');
        }
    }
    // Behandelt die Suchanfrage
    async handleSearch() {
        const query = document.getElementById('searchQuery').value;

        if (!query) {
            this.showPopup('Bitte geben Sie einen Suchbegriff ein', 'info');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const checkUrl = `/api/visitor/check-title/${encodeURIComponent(query)}`;

            const checkResponse = await fetch(checkUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!checkResponse.ok) {
                throw new Error(`Fehler beim Überprüfen der Existenz: ${checkResponse.statusText}`);
            }

            const checkData = await checkResponse.json();
            if (!checkData.exists) {
                this.showPopup(`Keine Ergebnisse für Titel "${query}" gefunden`, 'info');
                return;
            }

            const response = await fetch(`/api/visitor/search?title=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Search results:', data);
                this.clearMarkers();
                this.addMarkersToMap(data);
            } else if (response.status === 404) {
                this.showPopup('Keine Ergebnisse gefunden', 'info');
            } else {
                this.showPopup('Fehler bei der Suche', 'error');
            }
        } catch (error) {
            console.error('Fehler bei der Suche:', error);
            this.showPopup('Fehler bei der Suche', 'error');
        }
    }
    // Lädt die Daten für ein bestimmtes Jahr
    async loadData(year) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/visitor/data/year/${year}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error(`Fehler beim Laden der Daten: ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`Daten für das Jahr ${year} geladen:`, data);

            this.clearMarkers();
            this.addMarkersToMap(data);
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
            this.showPopup('Fehler beim Laden der Daten', 'error');
        }
    }
    // Lädt alle Daten
    async loadAllData() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/visitor/data', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Alle Daten geladen:', data);
                this.clearMarkers();
                this.addMarkersToMap(data);
            } else if (response.status === 404) {
                console.warn('Keine Daten gefunden');
                this.clearMarkers();
                this.addMarkersToMap({ type: "FeatureCollection", features: [] });
            } else {
                console.error('Fehler beim Laden der Daten:', response.statusText);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Daten:', error);
        }
    }
    // Entfernt alle Marker von der Karte
    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
        this.markerMap.clear();
    }
    // Findet einen Marker anhand seiner ID
    findMarkerById(id) {
        return this.markerMap.get(id);
    }
    // Fügt Marker zur Karte hinzu
    async addMarkersToMap(data) {
        let features = [];
        if (data.type === 'FeatureCollection') {
            features = data.features;
        } else if (Array.isArray(data)) {
            features = data.map(item => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [item.longitude, item.latitude]
                },
                properties: {
                    id: item.id,
                    name: item.work,
                    desc: item.description,
                    imageUrl: item.image_url,
                    audioUrl: item.audio_url,
                    videoUrl: item.video_url,
                    pdfUrl: item.pdf_url,
                    file360Url: item.panorama_url,
                    ThreeDObjectUrl: item.ThreeDObject_url,
                    url: item.url,
                    userName: item.user_name
                }
            }));
        } else {
            console.warn('No data available for the selected year.');
            this.showPopup('No data available for the selected year.', 'info');
            return;
        }

        for (const feature of features) {
            await this.addMarker(feature);
        }
    }
     // Fügt einen einzelnen Marker zur Karte hinzu
    async addMarker(feature) {
        const coordinates = feature.geometry.coordinates;
        const properties = feature.properties;

        const existingMarker = this.findMarkerById(properties.id);
        if (existingMarker) {
            existingMarker.setLatLng([coordinates[1], coordinates[0]]);
            return;
        }

        const customIcon = L.divIcon({
            className: 'pulse',
            iconSize: [7, 7],
            iconAnchor: [7, 7],
            popupAnchor: [0, -10]
        });

        const marker = L.marker([coordinates[1], coordinates[0]], { icon: customIcon, id: properties.id }).addTo(this.map);

        let tooltipContent = `<div><strong>${properties.userName}</strong></div>`;
        if (properties.imageUrl) {
            const imageUrl = await loadFile(properties.imageUrl);
            tooltipContent = `
                <div>
                    <img src="${imageUrl}" alt="Image">
                    <strong>${properties.userName}</strong>
                </div>
            `;
        }

        const tooltipOptions = {
            className: 'custom-tooltip',
            direction: 'top',
            offset: L.point(0, -40)
        };

        marker.bindTooltip(tooltipContent, tooltipOptions);

        const checkTooltipElement = () => {
            const tooltip = marker.getTooltip();
            if (tooltip) {
                const tooltipElement = tooltip.getElement();
                if (tooltipElement) {
                    tooltipElement.classList.add('leaflet-tooltip-fade');
                } else {
                    setTimeout(checkTooltipElement, 100);
                }
            }
        };

        setTimeout(checkTooltipElement, 0);

        marker.on('click', () => {
            this.showModal(properties);
        });

        this.markers.push(marker);
        this.markerMap.set(properties.id, marker);
    }
     // Aktualisiert das aktuell angezeigte Jahr
    updateCurrentYear(year) {
        document.getElementById('currentYear').textContent = year;
    }
    // Zeigt ein modales Fenster mit den Eigenschaften des Markers an
    async showModal(properties) {
        const modal = document.getElementById('modal');
        const modalText = document.getElementById('modalText');
        const modalFiles = document.getElementById('modalFiles');

        modalText.innerHTML = `
            <p><strong>Name: </strong>${properties.userName}</p>
            <p><strong>${properties.name}</strong></p>
            <p>${properties.desc}</p>
            <p><a href="${properties.url}" target="_blank">Mehr erfahren</a></p>
        `;

        let filesHtml = '';
        if (properties.imageUrl && properties.imageUrl.trim() !== 'null') {
            const imageUrl = await loadFile(properties.imageUrl);
            filesHtml += `<details><summary>Bild</summary><img src="${imageUrl}" alt="${properties.name}" style="width:auto; height:auto; max-height: 500px;"></details>`;
        }
        if (properties.audioUrl && properties.audioUrl.trim() !== 'null') {
            const audioUrl = await loadFile(properties.audioUrl);
            filesHtml += `<details><summary>Audio</summary><audio controls controlsList="nodownload"><source src="${audioUrl}" type="audio/mpeg">Your browser does not support the audio element.</audio></details>`;
        }
        if (properties.videoUrl && properties.videoUrl.trim() !== 'null') {
            const videoUrl = await loadFile(properties.videoUrl);
            filesHtml += `<details><summary>Video</summary><video controls controlsList="nodownload" style="width:100%; height:auto; max-height: 500px;"><source src="${videoUrl}" type="video/mp4">Your browser does not support the video element.</video></details>`;
        }
        if (properties.pdfUrl && properties.pdfUrl.trim() !== 'null') {
            const pdfUrl = await loadFile(properties.pdfUrl);
            filesHtml += `<details><summary >PDF</summary><embed src="${pdfUrl}#&view=FitH&toolbar=0&navpanes=0" type="application/pdf" height="270px" width="679" frameborder="0"></embed></details>`;
        }
        if (properties.file360Url && properties.file360Url.trim() !== 'null') {
            const file360Url = await loadFile(properties.file360Url);
            filesHtml += `<details><summary>360° Panorama</summary><div id="pannellumViewer" style="width: 100%; height: 500px;"></div></details>`;
            setTimeout(() => {
                pannellum.viewer('pannellumViewer', {
                    type: 'equirectangular',
                    panorama: file360Url,
                    autoLoad: true
                });
            }, 100);
        }
        if (properties.ThreeDObjectUrl && properties.ThreeDObjectUrl.trim() !== 'null') { 
            const ThreeDObjectUrl = await loadFile(properties.ThreeDObjectUrl);
            filesHtml += `<details><summary>3D Objekt</summary><model-viewer src="${ThreeDObjectUrl}" alt="3D Objekt" ar autoplay camera-controls style="width: 100%; height: 500px;"></model-viewer></details>`;
        }
        modalFiles.innerHTML = filesHtml;
        modal.style.display = "block";
    }
    // Zeigt eine Popup-Nachricht an
    showPopup(message, type = 'info') {
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
}
// Lädt eine Datei und gibt eine URL zurück
async function loadFile(filePath) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(filePath, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            const url = URL.createObjectURL(await response.blob());
            return url;
        } else {
            console.error('Failed to load file');
            return null;
        }
    } catch (error) {
        console.error('Error loading file:', error);
        return null;
    }
}
