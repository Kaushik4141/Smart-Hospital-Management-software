document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const wardGrid = document.getElementById('wardGrid');
    const wardModal = document.getElementById('wardModal');
    const modalBedInfo = document.getElementById('modalBedInfo');
    const patientDetails = document.getElementById('patientDetails');
    const bedActions = document.getElementById('bedActions');
    const totalBedsElement = document.getElementById('totalBeds');
    const occupiedBedsElement = document.getElementById('occupiedBeds');
    const availableBedsElement = document.getElementById('availableBeds');
    const closeBtn = document.querySelector('.ward-modal .close-btn');

    // State
    let wards = [];
    let beds = [];
    let patients = []; // To select a patient for admission

    // API and Socket Configuration
    const API_URL = 'http://localhost:5003/api';
    const SOCKET_URL = 'http://localhost:5003';
    const socket = io(SOCKET_URL);

    // Placeholder for JWT token
    // Authentication has been removed.

    // API Fetch Helper
    async function apiFetch(endpoint, options = {}) {
        const { method = 'GET', body = null } = options;
        const headers = {
            'Content-Type': 'application/json'
        };
        try {
            const response = await fetch(`${API_URL}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request failed');
            }
            return response.status === 204 ? null : await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Fetch all necessary data
    async function fetchAllData() {
        [wards, beds, patients] = await Promise.all([
            apiFetch('/wards'),
            apiFetch('/beds'),
            apiFetch('/patients')
        ]);
        if (wards && beds && patients) {
            updateBedStats();
            updateWardGrid();
        }
    }

    // Update UI
    function updateWardGrid() {
        if (!wardGrid || !wards || !wards.length) return;
        wardGrid.innerHTML = wards
            .map(ward => {
                const wardBeds = beds.filter(bed => bed.ward && bed.ward._id === ward._id);
                return `
                    <div class="ward-section">
                        <h3>${ward.name} (${ward.type})</h3>
                        <div class="bed-grid">
                            ${wardBeds.map(createBedCard).join('')}
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    function createBedCard(bed) {
        const statusClass = bed.isOccupied ? 'occupied' : 'available';
        const statusText = bed.isOccupied ? 'Occupied' : 'Available';
        const patientName = bed.isOccupied && bed.patient ? bed.patient.name : 'No Patient';
        
        return `
            <div class="bed-card ${statusClass}" data-id="${bed._id}">
                <h4>Bed ${bed.number}</h4>
                <div class="bed-info">
                    ${bed.isOccupied ? `<p>Patient: ${patientName}</p>` : ''}
                    <span class="bed-status status-${statusClass}">${statusText}</span>
                </div>
            </div>
        `;
    }

    function updateBedStats() {
        const totalBeds = beds.length;
        const occupiedBeds = beds.filter(bed => bed.isOccupied).length;
        const availableBeds = totalBeds - occupiedBeds;

        totalBedsElement.textContent = totalBeds;
        occupiedBedsElement.textContent = occupiedBeds;
        availableBedsElement.textContent = availableBeds;
    }

    // Modal functions
    async function showBedDetails(bedId) {
        const bed = await apiFetch(`/beds/${bedId}`);
        if (!bed) return;

        modalBedInfo.textContent = `Bed ${bed.number} (${bed.ward.name})`;
        
        if (bed.isOccupied && bed.patient) {
            patientDetails.innerHTML = `
                <h3>Patient Information</h3>
                <div class="patient-info-grid">
                    <div class="info-item"><label>Name</label><span>${bed.patient.name}</span></div>
                    <div class="info-item"><label>Age</label><span>${bed.patient.age}</span></div>
                    <div class="info-item"><label>Gender</label><span>${bed.patient.gender}</span></div>
                    <div class="info-item"><label>Admission Date</label><span>${new Date(bed.patient.admissionDate).toLocaleDateString()}</span></div>
                </div>
            `;
            bedActions.innerHTML = `<button class="action-btn btn-secondary" data-action="discharge" data-id="${bed._id}">Discharge Patient</button>`;
        } else {
            const waitingPatients = patients.filter(p => p.currentStatus === 'Waiting for Admission');
            const patientOptions = waitingPatients.map(p => `<option value="${p._id}">${p.name}</option>`).join('');
            patientDetails.innerHTML = '<h3>Bed is currently available</h3>';
            bedActions.innerHTML = `
                <div class="form-group">
                    <label for="patientSelect">Select Patient to Admit:</label>
                    <select id="patientSelect">${patientOptions}</select>
                </div>
                <button class="action-btn btn-primary" data-action="admit" data-id="${bed._id}">Admit Patient</button>
            `;
        }
        wardModal.classList.add('active');
    }

    function closeModal() {
        wardModal.classList.remove('active');
    }

    async function handleBedAction(e) {
        const action = e.target.dataset.action;
        const bedId = e.target.dataset.id;
        if (!action || !bedId) return;

        if (action === 'admit') {
            const patientSelect = document.getElementById('patientSelect');
            const patientId = patientSelect.value;
            if (!patientId) {
                alert('Please select a patient to admit.');
                return;
            }
            await apiFetch(`/beds/${bedId}/admit`, { method: 'POST', body: { patientId } });
        } else if (action === 'discharge') {
            await apiFetch(`/beds/${bedId}/discharge`, { method: 'POST' });
        }
        closeModal();
    }

    // Event Listeners
    wardGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.bed-card');
        if (card) {
            showBedDetails(card.dataset.id);
        }
    });

    bedActions.addEventListener('click', handleBedAction);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Socket.io event listeners
    socket.on('connect', () => console.log('Connected to Socket.io server'));
    socket.on('disconnect', () => console.log('Disconnected from Socket.io server'));

    socket.on('bedUpdated', (updatedBed) => {
        const index = beds.findIndex(b => b._id === updatedBed._id);
        if (index !== -1) {
            beds[index] = updatedBed;
        } else {
            beds.push(updatedBed);
        }
        updateBedStats();
        updateWardGrid();
    });

    // Initialize
    fetchAllData();
});