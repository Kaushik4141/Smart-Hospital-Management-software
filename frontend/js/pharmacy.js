document.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'http://localhost:5003/api';
  const SOCKET_URL = 'http://localhost:5003';
  const socket = io(SOCKET_URL, { transports: ['websocket'] });

  let drugs = [];
  let prescriptions = [];
  let currentDrugId = null;

  // DOM Elements
  const drugListEl = document.getElementById('drug-list');
  const inventoryListEl = document.getElementById('inventory-list');
  const prescriptionListEl = document.getElementById('prescriptionList');
  const addDrugForm = document.getElementById('add-drug-form');
  const editDrugForm = document.getElementById('edit-drug-form');
  const restockForm = document.getElementById('restock-form');
  const deleteConfirmModalEl = document.getElementById('delete-confirm-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

  // Billing DOM Elements
  const patientSearchInput = document.getElementById('patient-search');
  const patientSuggestionsEl = document.getElementById('patient-suggestions');
  const selectedPatientIdInput = document.getElementById('selected-patient-id');
  const patientDetailsEl = document.getElementById('patient-details');
  const patientInfoContentEl = document.getElementById('patient-info-content');
  const addBillItemBtn = document.getElementById('add-bill-item-btn');
  const billItemsListEl = document.getElementById('bill-items-list');
  const billSubtotalEl = document.getElementById('bill-subtotal');
  const billTaxEl = document.getElementById('bill-tax');
  const billTotalEl = document.getElementById('bill-total');
  const generateBillBtn = document.getElementById('generate-bill-btn');
  const drugSearchModalEl = document.getElementById('drug-search-modal');
  const billingDrugSearchInput = document.getElementById('billing-drug-search');
  const billingDrugSuggestionsEl = document.getElementById('billing-drug-suggestions');

  const modals = {
    edit: new bootstrap.Modal(document.getElementById('edit-drug-modal')),
    restock: new bootstrap.Modal(document.getElementById('restock-modal')),
    delete: new bootstrap.Modal(deleteConfirmModalEl),
    drugSearch: new bootstrap.Modal(drugSearchModalEl),
  };

  let currentBill = {
    patientId: null,
    items: [],
    subtotal: 0,
    tax: 0,
    totalAmount: 0,
  };

  // API Fetcher
  const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'API request failed');
    }
    if (response.status === 204) return null;
    return response.json();
  };

  // Render Functions
  const renderAll = () => {
    renderDrugList();
    renderInventoryList();
    renderPrescriptionList();
    updateStats();
  };

  const renderDrugList = () => {
    drugListEl.innerHTML = drugs.map(drug => `
      <tr>
        <td>${drug.name}</td>
        <td>${drug.code}</td>
        <td>${drug.category}</td>
        <td>${drug.stockQuantity} ${drug.unit}</td>
        <td>$${drug.unitPrice.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="openEditModal('${drug._id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="openDeleteModal('${drug._id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  };

  const renderInventoryList = () => {
    inventoryListEl.innerHTML = drugs.map(drug => `
      <tr>
        <td>${drug.name}</td>
        <td>${drug.category}</td>
        <td>${drug.stockQuantity} ${drug.unit}</td>
        <td class="${drug.stockQuantity < 10 ? 'text-danger fw-bold' : ''}">${drug.stockQuantity === 0 ? 'Out of Stock' : (drug.stockQuantity < 10 ? 'Low Stock' : 'In Stock')}</td>
        <td>
          <button class="btn btn-sm btn-success" onclick="openRestockModal('${drug._id}')">Restock</button>
        </td>
      </tr>
    `).join('');
  };

  const renderPrescriptionList = () => {
    const pendingPrescriptions = prescriptions.filter(p => p.status === 'Pending');
    prescriptionListEl.innerHTML = pendingPrescriptions.map(p => `
      <div class="prescription-item">
        <h5>Patient: ${p.patient.name}</h5>
        <p><strong>Doctor:</strong> ${p.doctor.name}</p>
        <p><strong>Date:</strong> ${new Date(p.createdAt).toLocaleDateString()}</p>
        <button class="btn btn-sm btn-primary" onclick="fulfillPrescription('${p._id}')">Fulfill</button>
      </div>
    `).join('');
  };

  const updateStats = () => {
    document.getElementById('total-drugs').textContent = drugs.length;
    document.getElementById('low-stock').textContent = drugs.filter(d => d.stockQuantity > 0 && d.stockQuantity < 10).length;
    document.getElementById('out-of-stock').textContent = drugs.filter(d => d.stockQuantity === 0).length;
    document.getElementById('pending-prescriptions').textContent = prescriptions.filter(p => p.status === 'Pending').length;
  };

  // Fetch Data
  const fetchData = async () => {
    try {
      [drugs, prescriptions] = await Promise.all([
        apiFetch('/drugs'),
        apiFetch('/prescriptions'),
      ]);
      renderAll();
    } catch (error) {
      console.error('Failed to fetch data:', error);
      alert('Failed to load data. Please check the console.');
    }
  };

  // Event Handlers
  addDrugForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(addDrugForm);
    const data = Object.fromEntries(formData.entries());
    data.unitPrice = parseFloat(data.unitPrice);
    data.stockQuantity = parseInt(data.stockQuantity, 10);
    try {
      await apiFetch('/drugs', { method: 'POST', body: JSON.stringify(data) });
      addDrugForm.reset();
    } catch (error) {
      alert(`Error adding drug: ${error.message}`);
    }
  });

  editDrugForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentDrugId) return;
    const formData = new FormData(editDrugForm);
    const data = Object.fromEntries(formData.entries());
    data.unitPrice = parseFloat(data.unitPrice);
    try {
      await apiFetch(`/drugs/${currentDrugId}`, { method: 'PUT', body: JSON.stringify(data) });
      modals.edit.hide();
    } catch (error) {
      alert(`Error updating drug: ${error.message}`);
    }
  });

  restockForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentDrugId) return;
    const quantity = document.getElementById('add-stock').value;
    try {
      await apiFetch(`/drugs/${currentDrugId}/restock`, { method: 'POST', body: JSON.stringify({ quantity }) });
      modals.restock.hide();
    } catch (error) {
      alert(`Error restocking drug: ${error.message}`);
    }
  });

  confirmDeleteBtn.addEventListener('click', async () => {
    if (!currentDrugId) return;
    try {
      await apiFetch(`/drugs/${currentDrugId}`, { method: 'DELETE' });
      modals.delete.hide();
    } catch (error) {
      alert(`Error deleting drug: ${error.message}`);
    }
  });

  // Tab Switching
  window.showTab = (tabName) => {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`).classList.add('active');
  };

  // Modal Openers
  window.openEditModal = (id) => {
    currentDrugId = id;
    const drug = drugs.find(d => d._id === id);
    if (!drug) return;
    editDrugForm.querySelector('#edit-drug-name').value = drug.name;
    editDrugForm.querySelector('#edit-drug-code').value = drug.code;
    editDrugForm.querySelector('#edit-category').value = drug.category;
    editDrugForm.querySelector('#edit-manufacturer').value = drug.manufacturer;
    editDrugForm.querySelector('#edit-description').value = drug.description;
    editDrugForm.querySelector('#edit-unit-price').value = drug.unitPrice;
    editDrugForm.querySelector('#edit-unit').value = drug.unit;
    modals.edit.show();
  };

  window.openRestockModal = (id) => {
    currentDrugId = id;
    const drug = drugs.find(d => d._id === id);
    if (!drug) return;
    restockForm.querySelector('#restock-drug-name').value = drug.name;
    restockForm.querySelector('#current-stock').value = drug.stockQuantity;
    restockForm.querySelector('#add-stock').value = '';
    modals.restock.show();
  };

  window.openDeleteModal = (id) => {
    currentDrugId = id;
    modals.delete.show();
  };

  window.fulfillPrescription = async (id) => {
    try {
      await apiFetch(`/prescriptions/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: 'Completed' }) });
    } catch (error) {
      alert(`Error fulfilling prescription: ${error.message}`);
    }
  };

  // Socket.io Listeners
  socket.on('drugCreated', (newDrug) => { drugs.push(newDrug); renderAll(); });
  socket.on('drugUpdated', (updatedDrug) => {
    const index = drugs.findIndex(d => d._id === updatedDrug._id);
    if (index > -1) drugs[index] = updatedDrug;
    renderAll();
  });
  socket.on('drugDeleted', (id) => { drugs = drugs.filter(d => d._id !== id); renderAll(); });
  socket.on('prescriptionCreated', (newPrescription) => { prescriptions.push(newPrescription); renderAll(); });
  socket.on('prescriptionUpdated', (updatedPrescription) => {
    const index = prescriptions.findIndex(p => p._id === updatedPrescription._id);
    if (index > -1) prescriptions[index] = updatedPrescription;
    renderAll();
  });

  // --- Billing Logic ---

  const resetBillingForm = () => {
    currentBill = {
      patientId: null,
      items: [],
      subtotal: 0,
      tax: 0,
      totalAmount: 0,
    };
    patientSearchInput.value = '';
    selectedPatientIdInput.value = '';
    patientDetailsEl.style.display = 'none';
    addBillItemBtn.disabled = true;
    renderBillItems();
    updateBillSummary();
  };

  const renderBillItems = () => {
    billItemsListEl.innerHTML = currentBill.items.map((item, index) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>$${item.unitPrice.toFixed(2)}</td>
        <td>$${item.total.toFixed(2)}</td>
        <td><button class="btn btn-sm btn-danger" onclick="removeBillItem(${index})">Remove</button></td>
      </tr>
    `).join('');
  };

  const updateBillSummary = () => {
    const subtotal = currentBill.items.reduce((acc, item) => acc + item.total, 0);
    const tax = subtotal * 0.05;
    const totalAmount = subtotal + tax;

    currentBill.subtotal = subtotal;
    currentBill.tax = tax;
    currentBill.totalAmount = totalAmount;

    billSubtotalEl.textContent = subtotal.toFixed(2);
    billTaxEl.textContent = tax.toFixed(2);
    billTotalEl.textContent = totalAmount.toFixed(2);
  };

  patientSearchInput.addEventListener('keyup', async (e) => {
    const query = e.target.value;
    if (query.length < 2) {
      patientSuggestionsEl.innerHTML = '';
      return;
    }
    try {
      const patients = await apiFetch(`/patients/search?name=${query}`);
      patientSuggestionsEl.innerHTML = patients.map(p => `<div class="suggestion-item" data-id="${p._id}" data-name="${p.name}">${p.name}</div>`).join('');
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  });

  patientSuggestionsEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion-item')) {
      const patientId = e.target.dataset.id;
      const patientName = e.target.dataset.name;
      
      selectedPatientIdInput.value = patientId;
      patientSearchInput.value = patientName;
      currentBill.patientId = patientId;
      
      patientInfoContentEl.textContent = `Selected Patient: ${patientName}`;
      patientDetailsEl.style.display = 'block';
      addBillItemBtn.disabled = false;
      patientSuggestionsEl.innerHTML = '';
    }
  });

  addBillItemBtn.addEventListener('click', () => {
    modals.drugSearch.show();
  });

  billingDrugSearchInput.addEventListener('keyup', async (e) => {
    const query = e.target.value;
    if (query.length < 2) {
      billingDrugSuggestionsEl.innerHTML = '';
      return;
    }
    try {
      const drugs = await apiFetch(`/drugs/search?name=${query}`);
      billingDrugSuggestionsEl.innerHTML = drugs.map(d => `
        <div class="suggestion-item" data-id='${d._id}' data-name='${d.name}' data-price='${d.unitPrice}' data-stock='${d.stockQuantity}'>
          ${d.name} (In Stock: ${d.stockQuantity})
        </div>
      `).join('');
    } catch (error) {
      console.error('Error searching drugs:', error);
    }
  });

  billingDrugSuggestionsEl.addEventListener('click', (e) => {
    const target = e.target.closest('.suggestion-item');
    if (target) {
      const drugId = target.dataset.id;
      const name = target.dataset.name;
      const unitPrice = parseFloat(target.dataset.price);
      const maxStock = parseInt(target.dataset.stock, 10);

      const quantity = parseInt(prompt(`Enter quantity for ${name} (max: ${maxStock}):`), 10);

      if (quantity && quantity > 0 && quantity <= maxStock) {
        currentBill.items.push({
          drugId,
          name,
          quantity,
          unitPrice,
          total: quantity * unitPrice,
        });
        renderBillItems();
        updateBillSummary();
        modals.drugSearch.hide();
        billingDrugSearchInput.value = '';
        billingDrugSuggestionsEl.innerHTML = '';
      } else {
        alert('Invalid quantity or exceeds stock.');
      }
    }
  });

  window.removeBillItem = (index) => {
    currentBill.items.splice(index, 1);
    renderBillItems();
    updateBillSummary();
  };

  generateBillBtn.addEventListener('click', async () => {
    if (!currentBill.patientId || currentBill.items.length === 0) {
      alert('Please select a patient and add items to the bill.');
      return;
    }

    try {
      await apiFetch('/bills', { method: 'POST', body: JSON.stringify(currentBill) });
      alert('Bill generated successfully!');
      resetBillingForm();
    } catch (error) {
      alert(`Error generating bill: ${error.message}`);
    }
  });

  // --- End Billing Logic ---

  socket.on('billCreated', (newBill) => {
    console.log('New bill created:', newBill);
    // Here you could update a list of recent bills, for example
  });

  // Initial Load
  fetchData();
});