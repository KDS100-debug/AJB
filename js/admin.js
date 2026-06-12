/* ============================================
   ADMIN PANEL MODULE
   ============================================ */

let cachedPayments = [];

document.addEventListener('DOMContentLoaded', function() {
    if (!verifyAdminAccess()) return;

    document.getElementById('adminName').textContent = localStorage.getItem('adminEmail') || 'Admin';
    setupAdminNavigation();
    setupAdminActions();
    loadDashboardAnalytics();
});

function verifyAdminAccess() {
    const adminToken = localStorage.getItem('adminToken');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    if (!adminToken && !isAdmin) {
        window.location.href = 'login.html';
        return false;
    }

    return true;
}

function setupAdminNavigation() {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();

            document.querySelectorAll('.menu-item').forEach(menuItem => menuItem.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.admin-section').forEach(section => section.classList.remove('active'));
            const sectionId = this.getAttribute('data-section');
            const section = document.getElementById(sectionId);
            if (section) section.classList.add('active');

            loadSectionData(sectionId);
        });
    });
}

function setupAdminActions() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.getElementById('modal').style.display = 'none';
        });
    }

    const studentSearch = document.getElementById('studentSearch');
    if (studentSearch) {
        studentSearch.addEventListener('input', function() {
            filterTable('#studentsTable tbody tr', this.value);
        });
    }

    ['paymentDateFilter', 'paymentUserFilter', 'paymentStatusFilter'].forEach(id => {
        const element = document.getElementById(id);
        if (element) element.addEventListener('input', applyPaymentFilters);
    });

    const clearFilters = document.getElementById('clearPaymentFilters');
    if (clearFilters) {
        clearFilters.addEventListener('click', function() {
            document.getElementById('paymentDateFilter').value = '';
            document.getElementById('paymentUserFilter').value = '';
            document.getElementById('paymentStatusFilter').value = '';
            applyPaymentFilters();
        });
    }
}

function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardAnalytics();
            break;
        case 'students':
            loadStudentsTable();
            break;
        case 'classes':
            loadClassesTable();
            break;
        case 'payments':
            loadPaymentsTable();
            break;
        default:
            break;
    }
}

async function loadDashboardAnalytics() {
    try {
        const response = await getDashboardStats();
        if (!response.success) return;

        setText('totalStudents', response.totalStudents || 0);
        setText('activeStudents', response.activeStudents || response.totalPaidUsers || 0);
        setText('totalRevenue', formatCurrency(response.totalRevenue || 0));
        setText('totalVideos', response.totalVideos || 0);
    } catch (error) {
        console.error('Error loading dashboard analytics:', error);
    }
}

async function loadStudentsTable() {
    try {
        const response = await getAllStudents();
        const tbody = document.querySelector('#studentsTable tbody');
        tbody.innerHTML = '';

        if (!response.success) return;

        (response.students || []).forEach(student => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="ID">${escapeHtml(student.id)}</td>
                <td data-label="Name">${escapeHtml(student.name)}</td>
                <td data-label="Email">${escapeHtml(student.email)}</td>
                <td data-label="Mobile">${escapeHtml(student.mobile)}</td>
                <td data-label="Subscription"><span class="status-badge ${statusClass(student.subscriptionStatus || student.status)}">${escapeHtml(student.subscriptionStatus || student.status)}</span></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

async function loadClassesTable() {
    try {
        const response = await getAllClasses();
        const tbody = document.querySelector('#classesTable tbody');
        tbody.innerHTML = '';

        if (!response.success) return;

        (response.classes || []).forEach(cls => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td data-label="Class ID">${escapeHtml(cls.id)}</td>
                <td data-label="Class Name">${escapeHtml(cls.name)}</td>
                <td data-label="Medium">${escapeHtml(cls.medium)}</td>
                <td data-label="Subjects">${escapeHtml(cls.subjectCount || 0)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading classes:', error);
    }
}

async function loadPaymentsTable() {
    try {
        const filters = readPaymentFilters();
        const response = await getAllPayments(filters);

        if (!response.success) {
            cachedPayments = [];
            renderPaymentsTable([]);
            return;
        }

        cachedPayments = response.payments || [];
        renderPaymentSummary(response, cachedPayments);
        renderPaymentsTable(cachedPayments);
        applyPaymentFilters();
    } catch (error) {
        console.error('Error loading payments:', error);
    }
}

function applyPaymentFilters() {
    const filters = readPaymentFilters();
    const filtered = cachedPayments.filter(payment => {
        const status = String(payment.status || payment.paymentStatus || '').toLowerCase();
        const date = String(payment.date || payment.paymentDate || '').slice(0, 10);
        const searchable = [
            payment.id,
            payment.paymentId,
            payment.studentName,
            payment.name,
            payment.email,
            payment.mobile,
            payment.razorpayPaymentId,
            payment.razorpayOrderId
        ].join(' ').toLowerCase();

        if (filters.status && status !== filters.status.toLowerCase()) return false;
        if (filters.date && date !== filters.date) return false;
        if (filters.user && !searchable.includes(filters.user.toLowerCase())) return false;
        return true;
    });

    renderPaymentSummary({}, filtered);
    renderPaymentsTable(filtered);
}

function readPaymentFilters() {
    return {
        date: document.getElementById('paymentDateFilter')?.value || '',
        user: document.getElementById('paymentUserFilter')?.value || '',
        status: document.getElementById('paymentStatusFilter')?.value || ''
    };
}

function renderPaymentSummary(response, payments) {
    const successfulPayments = payments.filter(payment => {
        const status = String(payment.status || payment.paymentStatus || '').toLowerCase();
        return ['captured', 'success', 'paid', 'active'].includes(status);
    });

    const totalRevenue = response.totalRevenue !== undefined
        ? Number(response.totalRevenue)
        : successfulPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const paidUsers = response.totalPaidUsers !== undefined
        ? Number(response.totalPaidUsers)
        : new Set(successfulPayments.map(payment => payment.userId || payment.email)).size;

    setText('paymentTotalRevenue', formatCurrency(totalRevenue));
    setText('paymentPaidUsers', paidUsers);
}

function renderPaymentsTable(payments) {
    const tbody = document.querySelector('#paymentsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!payments.length) {
        tbody.innerHTML = '<tr><td data-label="Payments" colspan="9" style="text-align:center;">No payments found.</td></tr>';
        return;
    }

    payments.forEach(payment => {
        const tr = document.createElement('tr');
        const paymentId = payment.id || payment.paymentId || payment.razorpayPaymentId || '';
        tr.innerHTML = `
            <td data-label="Payment ID">${escapeHtml(payment.id || payment.paymentId)}</td>
            <td data-label="User Name">${escapeHtml(payment.studentName || payment.name)}</td>
            <td data-label="Email">${escapeHtml(payment.email)}</td>
            <td data-label="Mobile">${escapeHtml(payment.mobile)}</td>
            <td data-label="Razorpay Payment ID">${escapeHtml(payment.razorpayPaymentId)}</td>
            <td data-label="Amount">${formatCurrency(payment.amount || 0)}</td>
            <td data-label="Date">${formatDate(payment.date || payment.paymentDate)}</td>
            <td data-label="Status"><span class="status-badge ${statusClass(payment.status || payment.paymentStatus)}">${escapeHtml(payment.status || payment.paymentStatus)}</span></td>
            <td data-label="Actions"><button class="btn btn-small btn-primary" data-payment-id="${escapeHtml(paymentId)}">View</button></td>
        `;
        tr.querySelector('button').addEventListener('click', () => viewPayment(paymentId));
        tbody.appendChild(tr);
    });
}

function viewPayment(paymentId) {
    const payment = cachedPayments.find(item =>
        [item.id, item.paymentId, item.razorpayPaymentId].includes(paymentId)
    );

    if (!payment) return;

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>Payment Details</h2>
        </div>
        <p><strong>User:</strong> ${escapeHtml(payment.studentName || payment.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(payment.email)}</p>
        <p><strong>Mobile:</strong> ${escapeHtml(payment.mobile)}</p>
        <p><strong>Amount:</strong> ${formatCurrency(payment.amount || 0)}</p>
        <p><strong>Status:</strong> ${escapeHtml(payment.status || payment.paymentStatus)}</p>
        <p><strong>Razorpay Payment ID:</strong> ${escapeHtml(payment.razorpayPaymentId)}</p>
        <p><strong>Razorpay Order ID:</strong> ${escapeHtml(payment.razorpayOrderId)}</p>
        <p><strong>Date:</strong> ${formatDate(payment.date || payment.paymentDate)}</p>
    `;
    modal.style.display = 'block';
}

function filterTable(selector, query) {
    const normalized = String(query || '').toLowerCase();
    document.querySelectorAll(selector).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(normalized) ? '' : 'none';
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function formatCurrency(amount) {
    return `\u20B9${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN');
}

function statusClass(status) {
    const normalized = String(status || '').toLowerCase();
    if (['active', 'success', 'captured', 'paid'].includes(normalized)) return 'active';
    if (['failed', 'inactive'].includes(normalized)) return 'inactive';
    return normalized || 'pending';
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
