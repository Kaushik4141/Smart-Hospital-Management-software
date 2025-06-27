document.addEventListener('DOMContentLoaded', () => {
    // API and Socket Configuration
    const API_URL = 'http://localhost:5003/api';
    const SOCKET_URL = 'http://localhost:5003';
    const socket = io(SOCKET_URL);

    // DOM Elements
    const admittedPatientsSpan = document.getElementById('admittedPatients');
    const availableBedsSpan = document.getElementById('availableBeds');
    const upcomingAppointmentsSpan = document.getElementById('upcomingAppointments');
    const totalDepartmentsSpan = document.getElementById('totalDepartments');
    const totalStaffSpan = document.getElementById('totalStaff');



    // API Fetch Helper
    async function apiFetch(endpoint, options = {}) {
        const { method = 'GET', body = null } = options;
        const headers = {
            'Content-Type': 'application/json',
        };
        try {
            const response = await fetch(`${API_URL}${endpoint}`, { method, headers, body: body ? JSON.stringify(body) : null });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'API request failed');
            }
            return response.json();
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return null;
        }
    }

    // Update dashboard with new stats
    function updateDashboard(stats) {
        if (!stats) return;
        admittedPatientsSpan.textContent = stats.admittedPatients ?? '0';
        availableBedsSpan.textContent = stats.availableBeds ?? '0';
        upcomingAppointmentsSpan.textContent = stats.upcomingAppointments ?? '0';
        totalDepartmentsSpan.textContent = stats.totalDepartments ?? '0';
        totalStaffSpan.textContent = stats.totalStaff ?? '0';
    }

    // Fetch initial data
    async function fetchInitialData() {
        const stats = await apiFetch('/dashboard/stats');
        if (stats) {
            updateDashboard(stats);
        }
    }

    // Socket.io event listeners
    socket.on('connect', () => {
        console.log('Connected to Socket.io server');
        fetchInitialData();
    });

    socket.on('dashboardUpdate', (stats) => {
        console.log('Received dashboard update:', stats);
        updateDashboard(stats);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
    });

    // Initial fetch
    fetchInitialData();
});