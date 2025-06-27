document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const API_URL = 'http://localhost:5003/api';
    const SOCKET_URL = 'http://localhost:5003';
    const socket = io(SOCKET_URL);

    // DOM Elements
    const patientRegistrationForm = document.getElementById('patientRegistrationForm');
    const patientDepartmentSelect = document.getElementById('patientDepartment');
    const patientList = document.getElementById('patientList');
    const patientSearch = document.getElementById('patientSearch');
    const statusFilter = document.getElementById('statusFilter');
    const patientDetailsModal = document.getElementById('patientDetailsModal');
    const totalPatientsSpan = document.getElementById('totalPatients');
    const waitingPatientsSpan = document.getElementById('waitingPatients');
    const inProgressPatientsSpan = document.getElementById('inProgressPatients');
    const transferType = document.getElementById('transferType');
    const transferDepartmentGroup = document.getElementById('transferDepartmentGroup');
    const transferDepartmentSelect = document.getElementById('transferDepartment');
    const transferDescription = document.getElementById('transferDescription');

    // State
    let allPatients = [];
    let allDepartments = [];
    let selectedPatient = null;

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
            return response.status === 204 ? null : response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            showNotification(error.message, 'error');
            return null;
        }
    }

    // Render Functions
    function renderPatientList() {
        const searchTerm = patientSearch.value.toLowerCase();
        const status = statusFilter.value;
        const filteredPatients = allPatients.filter(p => 
            p.name.toLowerCase().includes(searchTerm) && (status ? p.currentStatus === status : true)
        );

        patientList.innerHTML = '';
        filteredPatients.forEach(patient => patientList.appendChild(createPatientCard(patient)));
    }

    function createPatientCard(patient) {
        const card = document.createElement('div');
        card.className = `patient-card status-${patient.currentStatus.toLowerCase().replace(/\s+/g, '-')}`;
        card.dataset.id = patient._id;
        card.innerHTML = `
            <h4>${patient.name}</h4>
            <p>Dept: ${patient.department?.name || 'N/A'}</p>
            <p>Status: <span class="status">${patient.currentStatus}</span></p>
        `;
        card.addEventListener('click', () => openPatientModal(patient));
        return card;
    }

    function updateStats() {
        totalPatientsSpan.textContent = allPatients.length;
        waitingPatientsSpan.textContent = allPatients.filter(p => p.currentStatus === 'Waiting').length;
        inProgressPatientsSpan.textContent = allPatients.filter(p => p.currentStatus === 'In-Progress').length;
    }

    function populateDepartmentDropdowns(departments) {
        patientDepartmentSelect.innerHTML = '<option value="">Select Department</option>';
        transferDepartmentSelect.innerHTML = '<option value="">Select Department</option>';
        departments.forEach(dept => {
            const option = new Option(dept.name, dept._id);
            patientDepartmentSelect.add(option.cloneNode(true));
            transferDepartmentSelect.add(option);
        });
    }

    // Modal Handling
    function openPatientModal(patient) {
        selectedPatient = patient;
        document.getElementById('modalPatientName').textContent = patient.name;
        document.getElementById('patientDetails').innerHTML = `
            <p><strong>Age:</strong> ${patient.age}</p>
            <p><strong>Gender:</strong> ${patient.gender}</p>
            <p><strong>Contact:</strong> ${patient.contact}</p>
            <p><strong>Department:</strong> ${patient.department?.name || 'N/A'}</p>
            <p><strong>Status:</strong> ${patient.currentStatus}</p>
            <p><strong>History:</strong> ${patient.medicalHistory || 'None'}</p>
        `;
        patientDetailsModal.style.display = 'block';
    }

    window.closeModal = () => {
        patientDetailsModal.style.display = 'none';
        selectedPatient = null;
        transferType.value = '';
        transferDepartmentGroup.style.display = 'none';
    };

    // API Actions
    async function handleRegistration(e) {
        e.preventDefault();
        const formData = new FormData(patientRegistrationForm);
        const patientData = Object.fromEntries(formData.entries());
        
        const newPatient = await apiFetch('/patients/register', { method: 'POST', body: patientData });
        if (newPatient) {
            showNotification('Patient registered successfully!', 'success');
            patientRegistrationForm.reset();
            // UI will update via socket
        }
    }

    window.updateStatus = async (newStatus) => {
        if (!selectedPatient) return;
        const updated = await apiFetch(`/patients/${selectedPatient._id}/status`, { 
            method: 'PUT', 
            body: { currentStatus: newStatus }
        });
        if (updated) {
            showNotification('Status updated!', 'success');
            closeModal();
        }
    };

    window.transferPatient = async () => {
        if (!selectedPatient || transferType.value !== 'department' || !transferDepartmentSelect.value) {
            return showNotification('Please select a department for transfer.', 'error');
        }
        const transferData = {
            departmentId: transferDepartmentSelect.value,
            notes: transferDescription.value,
        };
        const transferred = await apiFetch(`/patients/${selectedPatient._id}/transfer`, { 
            method: 'POST', 
            body: transferData 
        });
        if (transferred) {
            showNotification('Patient transferred successfully!', 'success');
            closeModal();
        }
    };

    // Initial Data Load
    async function fetchInitialData() {
        const [patients, departments] = await Promise.all([
            apiFetch('/patients'),
            apiFetch('/departments')
        ]);
        if (patients) {
            allPatients = patients;
            renderPatientList();
            updateStats();
        }
        if (departments) {
            allDepartments = departments;
            populateDepartmentDropdowns(departments);
        }
    }

    // Socket Handlers
    function handlePatientCreated(patient) {
        allPatients.unshift(patient);
        renderPatientList();
        updateStats();
    }

    function handlePatientUpdated(patient) {
        const index = allPatients.findIndex(p => p._id === patient._id);
        if (index !== -1) {
            allPatients[index] = patient;
            renderPatientList();
            updateStats();
        }
    }

    function handlePatientDeleted(patientId) {
        allPatients = allPatients.filter(p => p._id !== patientId);
        renderPatientList();
        updateStats();
    }

    // Notifications
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    // Event Listeners
    patientRegistrationForm.addEventListener('submit', handleRegistration);
    patientSearch.addEventListener('input', renderPatientList);
    statusFilter.addEventListener('change', renderPatientList);
    transferType.addEventListener('change', () => {
        transferDepartmentGroup.style.display = transferType.value === 'department' ? 'block' : 'none';
    });
    patientDetailsModal.addEventListener('click', (e) => {
        if (e.target === patientDetailsModal) closeModal();
    });

    // Socket Connections
    socket.on('connect', () => {
        console.log('Connected to Socket.io server');
        fetchInitialData();
    });
    socket.on('patientCreated', handlePatientCreated);
    socket.on('patientUpdated', handlePatientUpdated);
    socket.on('patientDeleted', handlePatientDeleted);
    socket.on('disconnect', () => console.log('Disconnected from Socket.io server'));
});