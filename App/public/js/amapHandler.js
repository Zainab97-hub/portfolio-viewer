//amapHandler.js
export class AMapHandler {
     // Konstruktor: Initialisiert die Karte und die HTML-Elemente
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
        this.newYearInput = document.getElementById('newYearInput');
        this.confirmNewYearButton = document.getElementById('confirmNewYearButton');
        this.cancelNewYearButton = document.getElementById('cancelNewYearButton');
        this.yearPopup = document.getElementById('yearPopup');
        this.deleteYearInput = document.getElementById('deleteYearInput');
        this.confirmDeleteYearButton = document.getElementById('confirmDeleteYearButton');
        this.cancelDeleteYearButton = document.getElementById('cancelDeleteYearButton');
        this.deleteYearPopup = document.getElementById('deleteYearPopup');
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

        this.initEventListeners();
        this.loadPins(this.currentYear);
        // this.currentYearSpan.textContent = this.currentYear;
        this.loadYears();
        this.loadNames();
        this.checkCurrentYearAndLoadPins();
    }
    // Initialisiert die Event-Listener
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
        this.confirmNewYearButton.addEventListener('click', this.handleConfirmNewYear.bind(this));
        this.cancelNewYearButton.addEventListener('click', this.handleCancelNewYear.bind(this));
        this.confirmDeleteYearButton.addEventListener('click', this.handleConfirmDeleteYear.bind(this));
        this.cancelDeleteYearButton.addEventListener('click', this.handleCancelDeleteYear.bind(this));
        this.ThreeDObjectField.addEventListener('change', this.handleThreeDObjectChange.bind(this));
    }
    // Überprüft das aktuelle Jahr und lädt die Pins
    async checkCurrentYearAndLoadPins() {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/admin/check-year/${this.currentYear}`, {
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
            const response = await fetch(`/api/admin/search-suggestions?query=${encodeURIComponent(query)}`, {
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
    // Öffnet das Feld zum Hinzufügen eines neuen Jahres
    handleAddYearButtonClick() {
        const newYearInput = document.getElementById('newYearInput');
        newYearInput.style.display = 'inline';
        newYearInput.focus();
    }
    // Erstellt eine neue Jahreskarte
    async createNewYearMap(year) {
        this.clearMarkers();
        this.currentYear = year;
        this.currentYearSpan.textContent = this.currentYear;

        this.resetForm();

        await this.saveNewYear(year);
    }
    // Speichert ein neues Jahr
    async saveNewYear(year) {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('User ID or token is not set');
            return;
        }

        const requestBody = JSON.stringify({ year });
        console.log('Sending request to add year:', requestBody);

        const response = await fetch('/api/admin/add-year', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: requestBody
        });

        if (response.ok) {
            const result = await response.json();
            console.log('Response from add-year:', result);
            if (result.success) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                // Avoid duplicating current year
                if (!Array.from(this.selectYear.options).some(opt => opt.value == year)) {
                    this.selectYear.appendChild(option);
                }

                this.showPopup('Jahr erfolgreich hinzugefügt', 'success');
            } else {
                this.showPopup('Das Jahr existiert schon', 'error');
            }
        } else {
            const errorText = await response.text();
            console.error('Failed to save new year:', response.statusText, errorText);
            this.showPopup('Fehler beim Hinzufügen des Jahres', 'error');
        }
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
    // Bestätigt das Löschen eines Jahres
    async handleConfirmDeleteYear() {
        const yearToDelete = this.deleteYearInput.value.trim();
        if (yearToDelete) {
            try {
                const response = await fetch(`/api/admin/delete-year/${yearToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
       
                if (response.ok) {
                    this.showPopup('Jahr erfolgreich gelöscht', 'success');
                    this.clearMarkers();
                    this.currentYear = new Date().getFullYear();
                    this.currentYearSpan.textContent = this.currentYear;
                    await this.refreshYearDropdown();
                    this.selectYear.value = '';
                } else {
                    this.showPopup('Fehler beim Löschen des Jahres', 'error');
                }
            } catch (error) {
                console.error('Fehler beim Löschen des Jahres:', error);
                this.showPopup('Fehler beim Löschen des Jahres', 'error');
            } finally {
                this.deleteYearPopup.style.display = 'none';
                this.deleteYearInput.value = '';
                this.selectYear.value = '';
            }
        }
    }
        
     // Bricht das Löschen eines Jahres ab
    handleCancelDeleteYear() {
        this.deleteYearPopup.style.display = 'none';
        this.deleteYearInput.value = '';
        this.selectYear.value = '';
    }

    // Bestätigt das Hinzufügen eines neuen Jahres
    async handleConfirmNewYear() {
        const newYear = this.newYearInput.value.trim();
        if (newYear) {
            await this.createNewYearMap(newYear);
            this.yearPopup.style.display = 'none';
            this.newYearInput.value = '';
            await this.refreshYearDropdown();
            this.selectYear.value = newYear;
        }
    }
        
    // Bricht das Hinzufügen eines neuen Jahres ab
    handleCancelNewYear() {
        this.yearPopup.style.display = 'none';
        this.newYearInput.value = '';
        this.selectYear.value = '';
    }
    // Überprüft, ob Daten für das ausgewählte Jahr vorhanden sind
    async checkYearData(year) {
        const url = `/api/admin/data/year/${year}`;
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
    // Lädt die Pins für einen bestimmten Benutzer
    async loadPinsByUser(userId) {
        const url = `/api/admin/user/${userId}/pins`;
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
            const response = await fetch('/api/admin/users-with-works', {
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
    // Aktualisiert das Jahres-Dropdown-Menü
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
            const response = await fetch('/api/admin/years', {
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
    // Lädt die verfügbaren Jahre
    async loadYears() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/admin/years', {
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
    // Behandelt die Suchanfrage
    async handleSearch() {
        const query = document.getElementById('searchQuery').value;

        if (!query) {
            this.showPopup('Bitte geben Sie einen Suchbegriff ein', 'info');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const checkUrl = `/api/admin/check-title/${encodeURIComponent(query)}`;

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

            const response = await fetch(`/api/admin/search?title=${encodeURIComponent(query)}`, {
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
    // Entfernt alle Marker von der Karte
    clearMarkers() {
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];
    }
    // Findet einen Marker anhand seiner ID
    findMarkerById(id) {
        return this.markers.find(marker => marker.options.id === id);
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
            const existingMarker = this.findMarkerById(feature.properties.id);
            if (existingMarker) {
                // Update the existing marker data
                existingMarker.setLatLng([feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
                continue;
            }

            const icon = L.divIcon({
                className: 'pulse',
                iconSize: [7, 7],
                iconAnchor: [7, 7],
                popupAnchor: [0, -10]
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
            console.log('Tooltip created:', tooltip);

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
            });
            this.markers.push(marker);
        }
    }
    // Lädt eine Datei und gibt eine URL zurück
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
    // Behandelt das Ändern des Bildfeldes
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
    // Behandelt das Ändern des Audiofeldes
    handleAudioChange() {
        if (this.audioField.files && this.audioField.files[0]) {
            this.audioPreview.src = URL.createObjectURL(this.audioField.files[0]);
            this.audioPreview.style.display = 'block';
        }
    }
    // Behandelt das Ändern des Videofeldes
    handleVideoChange() {
        if (this.videoField.files && this.videoField.files[0]) {
            this.videoPreview.src = URL.createObjectURL(this.videoField.files[0]);
            this.videoPreview.style.display = 'block';
        }
    }
    // Behandelt das Ändern des PDFFeldes
    handlePdfChange() {
        if (this.pdfField.files && this.pdfField.files[0]) {
            this.pdfPreview.href = URL.createObjectURL(this.pdfField.files[0]);
            this.pdfPreview.style.display = 'block';
        }
    }
    // Behandelt das Ändern des 360°-Panoramafeldes
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
    // Behandelt das Ändern des 3D-Objektfeldes
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
    // Setzt das Formular zurück
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
    // Überprüft, ob ein Pin Daten enthält
    async checkPinData(pinId) {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/admin/check-pin-data/${pinId}`, {
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
            }, 350);
        }, 3500);
    }
    // Behandelt das Klicken auf die Karte
    handleMapClick(e) {
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }
        this.currentMarker = L.marker(e.latlng).addTo(this.map);
        this.pinForm.style.display = 'block';
        this.overlay.style.display = 'block';
        this.nameField.focus();
    }
    // Behandelt das Absenden des Formulars
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
        let url = `/api/admin/add-pin/${userId}`;
        let method = 'POST';
        if (pinId) {
          url = `/api/admin/edit-pin/${pinId}`;
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
    // Behandelt das Löschen eines Pins
    async handleDelete() {
        const pinId = this.pinIdField.value;
        if (pinId) {
            const token = localStorage.getItem('token');

            try {
                const response = await fetch(`/api/admin/delete-pin/${pinId}`, {
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
    // Lädt die Pins für ein bestimmtes Jahr
    async loadPins(year = null) {
        let url = '/api/admin/data';
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
    // Lädt alle Pins
    handleLoadAll() {
        this.loadPins();
    }
}
// Holt die Jahr-ID
async function getYearId(year) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('User ID or token is not set');
        return null;
    }

    const response = await fetch(`/api/admin/get-year-id/${year}`, {
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
// Fügt ein Jahr hinzu
async function addYear(year) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('User ID or token is not set');
        return null;
    }

    const response = await fetch('/api/admin/add-year', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ year })
    });

    if (response.ok) {
        const data = await response.json();
        return data;
    } else {
        console.error('Failed to add year');
        return null;
    }
}
