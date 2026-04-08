//smapHandler.js
export class SMapHandler {
    // Konstruktor: Initialisiert die Karte, die HTML-Elemente und die Event-Listener
    constructor() {
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

        // HTML-Elemente
        this.pinForm = document.getElementById('pinForm');
        this.form = document.getElementById('form');
        this.overlay = document.getElementById('overlay');
        this.pinIdField = document.getElementById('pinId');
        this.nameField = document.getElementById('name');
        this.descriptionField = document.getElementById('description');
        this.urlField = document.getElementById('url');
        this.imageField = document.getElementById('image');
        this.imagePreview = document.getElementById('imagePreview');
        this.audioField = document.getElementById('audio');
        this.audioPreview = document.getElementById('audioPreview');
        this.videoField = document.getElementById('video');
        this.videoPreview = document.getElementById('videoPreview');
        this.pdfField = document.getElementById('pdf');
        this.pdfPreview = document.getElementById('pdfPreview');
        this.file360Field = document.getElementById('panorama');
        this.file360Container = document.getElementById('file360Container');
        this.personNameField = document.getElementById('personName');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.closeBtn = document.getElementById('closeBtn');
        this.currentYearSpan = document.getElementById('currentYear');
        this.selectPerson = document.getElementById('selectPerson');
        this.selectYear = document.getElementById('selectYear');
        this.suggestionsContainer = document.getElementById('suggestionsContainer');
        this.ThreeDObjectField = document.getElementById('ThreeDObject');
        this.ThreeDObjectPreview = document.getElementById('ThreeDObjectPreview');

        this.currentMarker = null;
        this.currentYear = new Date().getFullYear();
        this.markers = [];
        this.currentImage = '';
        this.currentAudio = '';
        this.currentVideo = '';
        this.currentPdf = '';
        this.currentFile360 = '';
        this.currentPersonName = '';
        this.currentThreeDObject = '';

        this.initEventListeners(); // Initialisiert Event-Listener für verschiedene Elemente
        this.loadPins(this.currentYear); // Lädt die Pins für das aktuelle Jahr
        this.loadYears(); // Lädt verfügbare Jahre in ein Dropdown-Menü
        this.loadNames(); // Lädt verfügbare Benutzernamen in ein Dropdown-Menü
        this.checkCurrentYearAndLoadPins(); // Überprüft das aktuelle Jahr und lädt Pins, wenn Daten vorhanden sind
    }
     // Fügt Event-Listener zu den Formular-Elementen, dem Karten-Click-Event und anderen UI-Komponenten hinzu
    initEventListeners() {
        this.imageField.addEventListener('change', this.handleImageChange.bind(this));
        this.audioField.addEventListener('change', this.handleAudioChange.bind(this));
        this.videoField.addEventListener('change', this.handleVideoChange.bind(this));
        this.pdfField.addEventListener('change', this.handlePdfChange.bind(this));
        this.file360Field.addEventListener('change', this.handleFile360Change.bind(this));

        this.map.on('click', this.handleMapClick.bind(this));
        this.closeBtn.addEventListener('click', this.resetForm.bind(this));
        this.form.addEventListener('submit', this.handleFormSubmit.bind(this));
        this.deleteBtn.addEventListener('click', this.handleDelete.bind(this));

        document.getElementById('searchQuery').addEventListener('input', this.handleSearchInput.bind(this));
        document.getElementById('searchQuery').addEventListener('keypress', this.handleSearchKeyPress.bind(this));
        this.selectPerson.addEventListener('change', this.handleSelectPerson.bind(this));
        this.selectYear.addEventListener('change', this.handleSelectYear.bind(this));
        this.ThreeDObjectField.addEventListener('change', this.handleThreeDObjectChange.bind(this));
        document.getElementById('closeModal').addEventListener('click', () => {
            document.getElementById('modal').style.display = 'none';
        });
    }
    // Überprüft, ob das aktuelle Jahr Daten enthält, und lädt die entsprechenden Pins
    async checkCurrentYearAndLoadPins() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/student/check-year/${this.currentYear}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                this.loadPins(this.currentYear);
                this.currentYearSpan.textContent = this.currentYear;
            } else {
                this.showPopup('Eine leere Karte wird angezeigt.', 'info');
            }
        } catch (error) {
            console.error('Error checking Year:', error);
            this.showPopup('Fehler bei der Überprüfung des Jahres', 'error');
            return false;
        }
    }
    // Überprüft, ob die "Enter"-Taste gedrückt wurde, und führt die Suche aus
    handleSearchKeyPress(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            this.handleSearch();
        }
    }
     // Holt die Suchvorschläge basierend auf der Benutzereingabe und zeigt diese an
    async handleSearchInput(event) {
        const query = event.target.value.trim();

        if (!query) {
            this.suggestionsContainer.innerHTML = '';
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/student/search-suggestions?query=${encodeURIComponent(query)}`, {
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
    // Zeigt die Suchvorschläge im UI an
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

    
    // Lädt die Pins eines ausgewählten Benutzers in die Karte
    async handleSelectPerson() {
        const userId = this.selectPerson.value;
        if (userId) {
            this.loadPinsByUser(userId);
        } else {
            this.loadPins();
        }
    }
     // Lädt die Pins für ein ausgewähltes Jahr oder zeigt eine Meldung an, wenn keine Pins vorhanden sind
    async handleSelectYear() {
        const year = this.selectYear.value;
        if (year === 'addYear') {
            this.yearPopup.style.display = 'block';
        } else if (year === 'deleteYear') {
            this.deleteYearPopup.style.display = 'block';
        } else {
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
    }

    // Überprüft, ob Daten für das ausgewählte Jahr vorhanden sind
    async checkYearData(year) {
        const url = `/api/student/data/year/${year}`;
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
    // Lädt die Pins für einen spezifischen Benutzer
    async loadPinsByUser(userId) {
        const url = `/api/student/user/${userId}/pins`;
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
    // Lädt die Namen der Benutzer mit verfügbaren Arbeiten in ein Dropdown-Menü
    async loadNames() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/student/users-with-works', {
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
    // Aktualisiert das Dropdown-Menü mit den Jahren, um alle verfügbaren Jahre, sowie Optionen zum Hinzufügen oder Löschen eines Jahres, anzuzeigen
    async refreshYearDropdown() {
        this.selectYear.innerHTML = '';
    
        const allYearsOption = document.createElement('option');
        allYearsOption.value = '';
        allYearsOption.textContent = 'Alle Jahre';
        this.selectYear.appendChild(allYearsOption);
    
        const addYearOption = document.createElement('option');
        addYearOption.value = 'addYear';
        addYearOption.textContent = '+ Jahr hinzufügen';
        this.selectYear.appendChild(addYearOption);
    
        const deleteYearOption = document.createElement('option');
        deleteYearOption.value = 'deleteYear';
        deleteYearOption.textContent = ' - Jahr löschen';
        this.selectYear.appendChild(deleteYearOption);
    
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/student/years', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                data.forEach(year => {
                    const option = document.createElement('option');
                    option.value = year;
                    option.textContent = year;
                    // Avoid duplicating current year
                    if (!Array.from(this.selectYear.options).some(opt => opt.value == year)) {
                        this.selectYear.appendChild(option);
                    }

                });
            } else {
                this.showPopup('Fehler beim Laden der Jahre', 'error');
            }
        } catch (error) {
            this.showPopup('Fehler beim Laden der Jahre', 'error');
        }
    }
    
    
    // Lädt die verfügbaren Jahre und fügt sie in das entsprechende Dropdown-Menü ein
    async loadYears() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/student/years', {
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
                    // Avoid duplicating current year
                    if (!Array.from(this.selectYear.options).some(opt => opt.value == year)) {
                        this.selectYear.appendChild(option);
                    }

                });
                // Check if no years are available and show popup
            if (data.length === 0) {
                this.showPopup('Bitte fügen Sie zuerst ein Jahr hinzu, um Pins hinzufügen zu können.', 'info');
            }
            } else {
                this.showPopup('Fehler beim Laden der Jahre', 'error');
            }
        } catch (error) {
            this.showPopup('Fehler beim Laden der Jahre', 'error');
        }
    }
     // Führt die Suche nach einem Titel durch und zeigt die Ergebnisse in der Karte an
    async handleSearch() {
        const query = document.getElementById('searchQuery').value;

        if (!query) {
            this.showPopup('Bitte geben Sie einen Suchbegriff ein', 'info');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const checkUrl = `/api/student/check-title/${encodeURIComponent(query)}`;

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

            const response = await fetch(`/api/student/search?title=${encodeURIComponent(query)}`, {
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
     // Entfernt alle Marker aus der Karte
    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }
    // Findet einen Marker in der Karte anhand der ID
    findMarkerById(id) {
        return this.markers.find(marker => marker.options.id === id);
    }
    // Fügt Marker basierend auf den bereitgestellten Daten zur Karte hinzu
    async addMarkersToMap(data) {
        const userId = localStorage.getItem('userId');
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
                    userName: item.user_name,
                    userId: item.user_id
                }
            }));
        } else {
            console.warn('No data available for the selected year.');
            this.showPopup('No data available for the selected year.', 'info');
            return;
        }
    
        for (const feature of features) {
            const existingMarker = this.findMarkerById(feature.properties.id);
            if (existingMarker) {
                existingMarker.setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
                continue;
            }
    
            // Create different icons based on the user ID
            const icon = L.divIcon({
                className: 'pulse',
                iconSize: [7, 7],
                iconAnchor: [7, 7],
                popupAnchor: [0, -10],
                html: `<div style="background-color: ${feature.properties.userId == userId ? '#63f800' : '#12b9c1'}; width: 100%; height: 100%; border-radius: 50%;"></div>`
            });
    
            const marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                icon: icon,
                id: feature.properties.id
            }).addTo(this.map);
    
            let tooltipContent = `<div><strong>${feature.properties.userName}</strong></div>`;
            if (feature.properties.imageUrl) {
                const imageUrl = await this.loadFile(feature.properties.imageUrl);
                tooltipContent = `
                    <div>
                        <img src="${imageUrl}" alt="Image">
                        <strong>${feature.properties.userName}</strong>
                    </div>
                `;
            }
    
            const tooltip = marker.bindTooltip(tooltipContent, {
                className: 'custom-tooltip',
                direction: 'top',
                offset: L.point(0, -40)
            });
    
            const checkTooltipElement = () => {
                const tooltipElement = tooltip.getTooltip().getElement();
                if (tooltipElement) {
                    tooltipElement.classList.add('leaflet-tooltip-fade');
                } else {
                    setTimeout(checkTooltipElement, 100);
                }
            };
    
            setTimeout(checkTooltipElement, 0);
    
            marker.on('click', async () => {
                if (feature.properties.userId == userId) {
                    this.currentMarker = marker;
                    this.pinIdField.value = feature.properties.id;
                    this.nameField.value = feature.properties.name;
                    this.descriptionField.value = feature.properties.desc;
                    this.urlField.value = feature.properties.url;
                    this.currentImage = feature.properties.imageUrl ? await this.loadFile(feature.properties.imageUrl) : '';
                    this.currentAudio = feature.properties.audioUrl ? await this.loadFile(feature.properties.audioUrl) : '';
                    this.currentVideo = feature.properties.videoUrl ? await this.loadFile(feature.properties.videoUrl) : '';
                    this.currentPdf = feature.properties.pdfUrl ? await this.loadFile(feature.properties.pdfUrl) : '';
                    this.currentFile360 = feature.properties.file360Url ? await this.loadFile(feature.properties.file360Url) : '';
                    this.currentThreeDObject = feature.properties.ThreeDObjectUrl ? await this.loadFile(feature.properties.ThreeDObjectUrl) : '';
                    this.currentPersonName = feature.properties.userName;
    
                    if (this.currentImage) {
                        this.imagePreview.src = `${this.currentImage}`;
                        this.imagePreview.style.display = 'block';
                    } else {
                        this.imagePreview.style.display = 'none';
                    }
    
                    if (this.currentAudio) {
                        this.audioPreview.src = `${this.currentAudio}`;
                        this.audioPreview.style.display = 'block';
                    } else {
                        this.audioPreview.style.display = 'none';
                    }
    
                    if (this.currentVideo) {
                        this.videoPreview.src = `${this.currentVideo}`;
                        this.videoPreview.style.display = 'block';
                    } else {
                        this.videoPreview.style.display = 'none';
                    }
    
                    if (this.currentPdf) {
                        this.pdfPreview.src = `${this.currentPdf}#&view=FitH&toolbar=0&navpanes=0`;
                        this.pdfPreview.style.display = 'block';
                    } else {
                        this.pdfPreview.style.display = 'none';
                    }
    
                    if (this.currentFile360) {
                        this.file360Container.style.display = 'block';
                        pannellum.viewer(this.file360Container, {
                            type: 'equirectangular',
                            panorama: `${this.currentFile360}`,
                            autoLoad: true
                        });
                    } else {
                        this.file360Container.style.display = 'none';
                    }
    
                    if (this.currentThreeDObject) {
                        this.ThreeDObjectPreview.src = `${this.currentThreeDObject}`;
                        this.ThreeDObjectPreview.style.display = 'block';
                    } else {
                        this.ThreeDObjectPreview.style.display = 'none';
                    }
    
                    if (this.currentPersonName) {
                        this.personNameField.textContent = this.currentPersonName;
                    } else {
                        this.personNameField.textContent = '';
                    }
    
                    this.deleteBtn.style.display = 'block';
                    this.pinForm.style.display = 'block';
                    this.overlay.style.display = 'block';
                } else {
                    this.showModal(feature.properties);
                }
            });
            this.markers.push(marker);
        }
    }    
    // Zeigt ein Modal-Fenster mit Informationen und Dateien zu einem ausgewählten Marker an
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
            const imageUrl = await this.loadFile(properties.imageUrl);
            filesHtml += `<details><summary>Bild</summary><img src="${imageUrl}" alt="${properties.name}" style="width:auto; height:auto; max-height: 500px;"></details>`;
        }
        if (properties.audioUrl && properties.audioUrl.trim() !== 'null') {
            const audioUrl = await this.loadFile(properties.audioUrl);
            filesHtml += `<details><summary>Audio</summary><audio controls controlsList="nodownload"><source src="${audioUrl}" type="audio/mpeg">Your browser does not support the audio element.</audio></details>`;
        }
        if (properties.videoUrl && properties.videoUrl.trim() !== 'null') {
            const videoUrl = await this.loadFile(properties.videoUrl);
            filesHtml += `<details><summary>Video</summary><video controls controlsList="nodownload" style="width:100%; height:auto; max-height: 500px;"><source src="${videoUrl}" type="video/mp4">Your browser does not support the video element.</video></details>`;
        }
        if (properties.pdfUrl && properties.pdfUrl.trim() !== 'null') {
            const pdfUrl = await this.loadFile(properties.pdfUrl);
            filesHtml += `<details><summary>PDF anzeigen</summary><embed src="${pdfUrl}#&view=FitH&toolbar=0&navpanes=0" type="application/pdf" height="270px" width="679" frameborder="0"></embed></details>`;
        }
        if (properties.file360Url && properties.file360Url.trim() !== 'null') {
            const file360Url = await this.loadFile(properties.file360Url);
            filesHtml += `<details><summary>360° anzeigen</summary><div id="pannellumViewer" style="width: 100%; height: 500px;"></div></details>`;
            setTimeout(() => {
                pannellum.viewer('pannellumViewer', {
                    type: 'equirectangular',
                    panorama: file360Url,
                    autoLoad: true
                });
            }, 100);
        }
        if (properties.ThreeDObjectUrl && properties.ThreeDObjectUrl.trim() !== 'null') { 
            const ThreeDObjectUrl = await this.loadFile(properties.ThreeDObjectUrl);
            filesHtml += `<details><summary>3D Objekt anzeigen</summary><model-viewer src="${ThreeDObjectUrl}" alt="3D Objekt" ar autoplay camera-controls style="width: 100%; height: 500px;"></model-viewer></details>`;
        }
        modalFiles.innerHTML = filesHtml;
        modal.style.display = "block";
    }
    // Lädt eine Datei (z. B. Bild, Video) und erstellt eine URL für die Anzeige
    async loadFile(filePath) {
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
     // Aktualisiert die Bildvorschau, wenn ein neues Bild ausgewählt wird
    handleImageChange() {
        if (this.imageField.files && this.imageField.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview.src = e.target.result;
                this.imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(this.imageField.files[0]);
        }
    }
    // Aktualisiert die Audiovorschau, wenn eine neue Audiodatei ausgewählt wird
    handleAudioChange() {
        if (this.audioField.files && this.audioField.files[0]) {
            this.audioPreview.src = URL.createObjectURL(this.audioField.files[0]);
            this.audioPreview.style.display = 'block';
        }
    }
    // Aktualisiert die Videovorschau, wenn ein neues Video ausgewählt wird
    handleVideoChange() {
        if (this.videoField.files && this.videoField.files[0]) {
            this.videoPreview.src = URL.createObjectURL(this.videoField.files[0]);
            this.videoPreview.style.display = 'block';
        }
    }
    // Aktualisiert die PDF-Vorschau, wenn ein neues PDF ausgewählt wird
    handlePdfChange() {
        if (this.pdfField.files && this.pdfField.files[0]) {
            this.pdfPreview.href = URL.createObjectURL(this.pdfField.files[0]);
            this.pdfPreview.style.display = 'block';
        }
    }
    // Zeigt eine 360°-Ansicht an, wenn eine entsprechende Datei ausgewählt wird
    handleFile360Change() {
        if (this.file360Field.files && this.file360Field.files[0]) {
            this.file360Container.style.display = 'block';
            const file = this.file360Field.files[0];
            const url = URL.createObjectURL(file);
            this.currentFile360 = url;
            pannellum.viewer(this.file360Container, {
                type: 'equirectangular',
                panorama: url,
                autoLoad: true
            });
        }
    }
    // Aktualisiert die 3D-Objektvorschau, wenn ein neues 3D-Objekt ausgewählt wird
    handleThreeDObjectChange() {
        if (this.ThreeDObjectField.files && this.ThreeDObjectField.files[0]) {
          const reader = new FileReader();
          reader.onload = (e) => {
            this.ThreeDObjectPreview.src = e.target.result;
            this.ThreeDObjectPreview.style.display = 'block';
          };
          reader.readAsDataURL(this.ThreeDObjectField.files[0]);
        }
      }
      // Setzt das Formular zurück und entfernt ggf. den Marker aus der Karte
    resetForm() {
        const isEmpty = !this.nameField.value && !this.descriptionField.value && !this.urlField.value && !this.imageField.value && !this.audioField.value && !this.videoField.value && !this.pdfField.value && !this.file360Field.value;

        if (isEmpty && this.currentMarker && !this.pinIdField.value) {
            const pinId = this.pinIdField.value;
            if (pinId) {
                this.checkPinData(pinId).then(hasData => {
                    if (!hasData) {
                        this.map.removeLayer(this.currentMarker);
                        this.currentMarker = null;
                    }
                });
            } else {
                this.map.removeLayer(this.currentMarker);
                this.currentMarker = null;
            }
        }

        this.pinIdField.value = '';
        this.nameField.value = '';
        this.descriptionField.value = '';
        this.urlField.value = '';
        this.imageField.value = '';
        this.imagePreview.src = '';
        this.imagePreview.style.display = 'none';
        this.audioField.value = '';
        this.audioPreview.src = '';
        this.audioPreview.style.display = 'none';
        this.videoField.value = '';
        this.videoPreview.src = '';
        this.videoPreview.style.display = 'none';
        this.pdfField.value = '';
        this.pdfPreview.href = '';
        this.pdfPreview.style.display = 'none';
        this.file360Field.value = '';
        this.file360Container.style.display = 'none';
        this.currentImage = '';
        this.currentAudio = '';
        this.currentVideo = '';
        this.currentPdf = '';
        this.currentFile360 = '';
        this.currentPersonName = '';
        this.personNameField.textContent = '';
        this.deleteBtn.style.display = 'none';
        this.pinForm.style.display = 'none';
        this.overlay.style.display = 'none';
        this.ThreeDObjectField.value = '';
        this.ThreeDObjectPreview.src = '';
        this.ThreeDObjectPreview.style.display = 'none';
        this.currentThreeDObject = '';
    }
    // Überprüft, ob ein Pin Daten (wie Bild, Audio, etc.) enthält
    async checkPinData(pinId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/student/check-pin-data/${pinId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                return data.hasData;
            } else {
                throw new Error(`Failed to check pin data: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error checking pin data:', error);
            this.showPopup('Error checking pin data', 'error');
            return false;
        }
    }
    // Zeigt eine Popup-Meldung mit dem angegebenen Typ (info, error) an
    showPopup(message, type = 'info') {
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
    // Fügt einen Marker an der geklickten Stelle auf der Karte hinzu und zeigt das Formular zum Bearbeiten an
    handleMapClick(e) {
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }
        this.currentMarker = L.marker(e.latlng).addTo(this.map);
        this.pinForm.style.display = 'block';
        this.overlay.style.display = 'block';
        this.nameField.focus();
    }
    // Sendet das Formular, um einen neuen Pin hinzuzufügen oder einen vorhandenen Pin zu bearbeiten
    async handleFormSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
      
        formData.append('latitude', this.currentMarker.getLatLng().lat);
        formData.append('longitude', this.currentMarker.getLatLng().lng);
      
        const year_id = await getYearId(this.currentYear);
        if (!year_id) {
          console.warn('Year ID not set or year does not exist in the database.');
          this.showPopup('Year ID not set or year does not exist in the database.', 'warning');
          return;
        }
        formData.append('year_id', year_id);
      
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('userId is not set');
          this.showPopup('userId is not set', 'error');
          return;
        }
        formData.append('userId', userId);
      
        formData.append('currentImage', this.currentImage);
        formData.append('currentAudio', this.currentAudio);
        formData.append('currentVideo', this.currentVideo);
        formData.append('currentPdf', this.currentPdf);
        formData.append('currentFile360', this.currentFile360);
        formData.append('currentThreeDObject', this.currentThreeDObject);
      
        console.log('Submitting form with:', {
          latitude: this.currentMarker.getLatLng().lat,
          longitude: this.currentMarker.getLatLng().lng,
          year_id: year_id,
          userId: userId
        });
      
        const pinId = this.pinIdField.value;
        console.log(pinId);
        let url = `/api/student/add-pin/${userId}`;
        let method = 'POST';
        if (pinId) {
          url = `/api/student/edit-pin/${pinId}`;
          method = 'PUT';
        }
      
        const token = localStorage.getItem('token');
      
        try {
          const response = await fetch(url, {
            method: method,
            body: formData,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
      
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }
      
          const result = await response.json();
          console.log('Pin added:', result);
          if (result.success) {
            this.showPopup('Pin erfolgreich hinzufügt', 'success');
            this.resetForm();
            if (this.currentMarker) {
              this.map.removeLayer(this.currentMarker);
              this.currentMarker = null;
            }
            this.loadPins(this.currentYear);
          } else {
            this.showPopup('Fehler beim Hinzufügen der PIN', 'error');
          }
        } catch (error) {
          console.error('Fehler beim Speichern der PIN:', error);
          this.showPopup('Fehler beim Hinzufügen der PIN', 'error');
        }
      }      
      // Löscht einen Pin und entfernt ihn von der Karte
    async handleDelete() {
        const pinId = this.pinIdField.value;
        if (pinId) {
            const token = localStorage.getItem('token');

            try {
                const response = await fetch(`/api/student/delete-pin/${pinId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const result = await response.json();
                if (result.success) {
                    this.showPopup('Pin erfolgreich gelöscht', 'success');
                    this.resetForm();
                    if (this.currentMarker) {
                        this.map.removeLayer(this.currentMarker);
                        this.currentMarker = null;
                    }
                } else {
                    this.showPopup('Fehler beim Löschen des Pins', 'error');
                }
            } catch (error) {
                console.error('Fehler beim Löschen des Pins:', error);
                this.showPopup('Fehler beim Löschen des Pins', 'error');
            }
        }
    }
    // Lädt alle Pins (oder nur die eines bestimmten Jahres) und fügt sie der Karte hinzu
    async loadPins(year = null) {
        let url = '/api/student/data';
        if (year) {
            url += `/year/${year}`;
        }

        this.clearMarkers();

        try {
            const token = localStorage.getItem('token');
            console.log(localStorage.getItem('token'));

            if (!token) {
                console.error('Token not found');
                this.showPopup('Nicht autorisiert: Token nicht gefunden', 'error');
                return;
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    console.error('Unauthorized: Invalid token');
                    this.showPopup('Nicht autorisiert: Ungültiges Token', 'error');
                } else {
                    throw new Error(response.statusText);
                }
                return;
            }
            const data = await response.json();
            console.log('Pins geladen:', data);

            this.addMarkersToMap(data);
        } catch (error) {
            console.error('Fehler beim Laden der Pins:', error);
            this.showPopup('Fehler beim Laden der Pins', 'error');
        }
    }
    // Lädt alle verfügbaren Pins in die Karte
    handleLoadAll() {
        this.loadPins();
    }
}
// Hilfsfunktion: Holt die ID für ein bestimmtes Jahr
async function getYearId(year) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('User ID or token is not set');
        return null;
    }

    const response = await fetch(`/api/student/get-year-id/${year}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        return data.year_id;
    } else {
        console.error('Failed to fetch year_id');
        return null;
    }
}

