document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const departmentGrid = document.querySelector('.department-grid');
    const departmentModal = document.getElementById('departmentModal');
    const modalDepartmentName = document.getElementById('modalDepartmentName');
    const waitingCount = document.getElementById('waitingCount');
    const inProgressCount = document.getElementById('inProgressCount');
    const completedCount = document.getElementById('completedCount');
    const patientList = document.getElementById('patientList');
    const closeBtn = document.querySelector('.modal-header .close-btn');

    // State
    let departments = [];
    let departmentPatients = {};
    let activeDepartmentId = null;

    // API and Socket Configuration
    const API_URL = 'http://localhost:5003/api';
    const SOCKET_URL = 'http://localhost:5003';
    const socket = io(SOCKET_URL);

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
            return await response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            // Implement user-friendly error notification here
            return null;
        }
    }

    // Fetch initial data
    async function fetchAllData() {
        departments = await apiFetch('/departments');
        if (departments) {
            await fetchAllDepartmentPatients();
            updateDepartmentGrid();
        }
    }

    async function fetchAllDepartmentPatients() {
        const patientPromises = departments.map(dept => apiFetch(`/patients?departmentId=${dept._id}`));
        const results = await Promise.all(patientPromises);
        results.forEach((patients, index) => {
            if (patients) {
                departmentPatients[departments[index]._id] = patients;
            }
        });
    }

    // Render department grid
    function updateDepartmentGrid() {
        if (!departmentGrid) return;
        departmentGrid.innerHTML = departments
            .filter(dept => dept.isActive)
            .map(dept => {
                const patients = departmentPatients[dept._id] || [];
                const waiting = patients.filter(p => p.currentStatus === 'Waiting').length;
                const inProgress = patients.filter(p => p.currentStatus === 'In-Progress').length;
                const completed = patients.filter(p => p.currentStatus === 'Completed').length;

                return `
                    <div class="department-card" data-id="${dept._id}">
                        <h2>${dept.name}</h2>
                        <p>${dept.description || 'No description available.'}</p>
                        <div class="department-stats">
                            <div class="stat-item"><h4>Waiting</h4><span>${waiting}</span></div>
                            <div class="stat-item"><h4>In Progress</h4><span>${inProgress}</span></div>
                            <div class="stat-item"><h4>Completed</h4><span>${completed}</span></div>
                        </div>
                    </div>
                `;
            })
            .join('');
    }

    // Modal functions
    function showDepartmentDetails(departmentId) {
        const department = departments.find(d => d._id === departmentId);
        if (!department) return;

        activeDepartmentId = departmentId;
        modalDepartmentName.textContent = department.name;
        updateModalContent(departmentId);
        departmentModal.classList.add('active');
    }

    function closeModal() {
        departmentModal.classList.remove('active');
        activeDepartmentId = null;
    }

    function updateModalContent(departmentId) {
        const patients = departmentPatients[departmentId] || [];
        updateDepartmentStats(patients);
        updatePatientList(patients);
    }

    function updateDepartmentStats(patients) {
        waitingCount.textContent = patients.filter(p => p.currentStatus === 'Waiting').length;
        inProgressCount.textContent = patients.filter(p => p.currentStatus === 'In-Progress').length;
        completedCount.textContent = patients.filter(p => p.currentStatus === 'Completed').length;
    }

    function updatePatientList(patients) {
        patientList.innerHTML = patients
            .sort((a, b) => {
                const order = { 'Waiting': 0, 'In-Progress': 1, 'Completed': 2 };
                return order[a.currentStatus] - order[b.currentStatus] || new Date(a.createdAt) - new Date(b.createdAt);
            })
            .map(patient => `
                <div class="patient-item">
                    <div class="patient-info">
                        <h4>${patient.name}</h4>
                        <p>Token: ${patient.tokenNumber || 'N/A'}</p>
                    </div>
                    <span class="patient-status status-${(patient.currentStatus || '').toLowerCase().replace(' ', '-')}">
                        ${patient.currentStatus}
                    </span>
                </div>
            `)
            .join('');
    }

    // Event Listeners
    departmentGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.department-card');
        if (card) {
            showDepartmentDetails(card.dataset.id);
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }

    // Socket.io event listeners
    socket.on('connect', () => console.log('Connected to Socket.io server'));
    socket.on('disconnect', () => console.log('Disconnected from Socket.io server'));

    socket.on('patientCreated', (patient) => {
        if (patient && patient.department) {
            const deptId = patient.department._id;
            if (!departmentPatients[deptId]) {
                departmentPatients[deptId] = [];
            }
            departmentPatients[deptId].push(patient);
            updateDepartmentGrid();
            if (activeDepartmentId === deptId) {
                updateModalContent(deptId);
            }
        }
    });

    socket.on('patientUpdated', (patient) => {
        if (patient && patient.department) {
            const deptId = patient.department._id;
            if (departmentPatients[deptId]) {
                const index = departmentPatients[deptId].findIndex(p => p._id === patient._id);
                if (index !== -1) {
                    departmentPatients[deptId][index] = patient;
                    updateDepartmentGrid();
                    if (activeDepartmentId === deptId) {
                        updateModalContent(deptId);
                    }
                }
            }
        }
    });

    socket.on('patientDeleted', ({ id }) => {
        for (const deptId in departmentPatients) {
            const index = departmentPatients[deptId].findIndex(p => p._id === id);
            if (index !== -1) {
                departmentPatients[deptId].splice(index, 1);
                updateDepartmentGrid();
                if (activeDepartmentId === deptId) {
                    updateModalContent(deptId);
                }
                break;
            }
        }
    });

    // Initialize
    fetchAllData();
});