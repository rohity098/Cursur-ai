// Admin Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
    setupEventListeners();
    checkAdminAuth();
});

let currentAdmin = null;
let isAdminAuthMode = 'login';

// Initialize admin panel
function initializeAdminPanel() {
    console.log('Admin Panel Initialized');
    
    // Set up navigation
    setupNavigation();
    
    // Show admin auth modal if not logged in
    if (!window.firebaseUtils || !window.firebaseUtils.auth.currentUser) {
        showAdminAuthModal();
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
        tab.addEventListener('click', handleFilterChange);
    });
    
    // Forms
    const createTournamentForm = document.getElementById('createTournamentForm');
    if (createTournamentForm) {
        createTournamentForm.addEventListener('submit', handleCreateTournament);
    }
    
    const editTournamentForm = document.getElementById('editTournamentForm');
    if (editTournamentForm) {
        editTournamentForm.addEventListener('submit', handleEditTournament);
    }
    
    const adminAuthForm = document.getElementById('adminAuthForm');
    if (adminAuthForm) {
        adminAuthForm.addEventListener('submit', handleAdminAuth);
    }
    
    const platformSettings = document.getElementById('platformSettings');
    if (platformSettings) {
        platformSettings.addEventListener('submit', handlePlatformSettings);
    }
    
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Modal close buttons
    const closeButtons = document.querySelectorAll('.close-btn');
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = btn.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

// Check admin authentication
function checkAdminAuth() {
    if (window.firebaseUtils && window.firebaseUtils.auth) {
        window.firebaseUtils.auth.onAuthStateChanged((user) => {
            if (user) {
                // Check if user is admin
                checkAdminRole(user);
            } else {
                currentAdmin = null;
                showAdminAuthModal();
            }
        });
    } else {
        // Mock admin for demo
        setTimeout(() => {
            currentAdmin = { uid: 'admin-user', email: 'admin@example.com', displayName: 'Admin User' };
            loadAdminDashboard();
        }, 1000);
    }
}

// Check admin role
async function checkAdminRole(user) {
    try {
        // In a real app, check user role in database
        // For demo, assume user is admin
        currentAdmin = user;
        closeModal('adminAuthModal');
        loadAdminDashboard();
    } catch (error) {
        console.error('Error checking admin role:', error);
        showMessage('Access denied. Admin privileges required.', 'error');
        showAdminAuthModal();
    }
}

// Setup navigation
function setupNavigation() {
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        if (section.id !== 'dashboard') {
            section.classList.remove('active');
        }
    });
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const targetSection = e.target.getAttribute('data-section');
    
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    // Update active section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(targetSection).classList.add('active');
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = e.target.textContent.trim();
    }
    
    // Load section-specific data
    loadSectionData(targetSection);
}

// Load section data
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'tournaments':
            loadTournamentsData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'analytics':
            loadAnalyticsData();
            break;
        case 'settings':
            loadSettingsData();
            break;
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    try {
        // Update admin info in sidebar
        updateAdminInfo();
        
        // Load dashboard data
        loadDashboardData();
        
        // Load recent activity
        loadRecentActivity();
        
        // Initialize charts
        initializeCharts();
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Update admin info
function updateAdminInfo() {
    const adminNameEl = document.getElementById('adminName');
    
    if (currentAdmin && adminNameEl) {
        adminNameEl.textContent = currentAdmin.displayName || 'Admin';
    }
}

// Load dashboard data
function loadDashboardData() {
    // Mock data for demo
    const stats = {
        totalTournaments: 45,
        totalUsers: 1250,
        activeTournaments: 8,
        totalRevenue: 12500
    };
    
    const totalTournamentsEl = document.getElementById('totalTournaments');
    const totalUsersEl = document.getElementById('totalUsers');
    const activeTournamentsEl = document.getElementById('activeTournaments');
    const totalRevenueEl = document.getElementById('totalRevenue');
    
    if (totalTournamentsEl) totalTournamentsEl.textContent = stats.totalTournaments;
    if (totalUsersEl) totalUsersEl.textContent = stats.totalUsers;
    if (activeTournamentsEl) activeTournamentsEl.textContent = stats.activeTournaments;
    if (totalRevenueEl) totalRevenueEl.textContent = `$${stats.totalRevenue.toLocaleString()}`;
}

// Load recent activity
function loadRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    // Mock activity data
    const activities = [
        { type: 'success', message: 'New tournament "Free Fire Championship" created', time: '2 minutes ago' },
        { type: 'info', message: 'User "ProGamer123" joined BGMI Battle Royale', time: '5 minutes ago' },
        { type: 'warning', message: 'Tournament "Squad Wars" is nearly full', time: '10 minutes ago' },
        { type: 'success', message: 'Payment processed for tournament entry', time: '15 minutes ago' },
        { type: 'info', message: 'New user registered: FireMaster', time: '20 minutes ago' }
    ];
    
    const html = activities.map(activity => `
        <div class="activity-item ${activity.type}">
            <i class="fas fa-${activity.type === 'success' ? 'check-circle' : activity.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <div class="activity-content">
                <p>${activity.message}</p>
                <small>${activity.time}</small>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Initialize charts
function initializeCharts() {
    // Initialize dashboard chart
    const statsChart = document.getElementById('statsChart');
    if (statsChart && window.Chart) {
        new Chart(statsChart, {
            type: 'doughnut',
            data: {
                labels: ['Free Fire', 'BGMI'],
                datasets: [{
                    data: [60, 40],
                    backgroundColor: ['#ff6b6b', '#4834d4']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Load tournaments data
function loadTournamentsData() {
    const container = document.getElementById('tournamentsTableBody');
    if (!container) return;
    
    // Mock tournament data
    const tournaments = [
        {
            id: '1',
            name: 'Free Fire Championship',
            game: 'Free Fire',
            status: 'open',
            participants: 45,
            maxParticipants: 100,
            prizePool: 500,
            date: '2024-01-15'
        },
        {
            id: '2',
            name: 'BGMI Battle Royale',
            game: 'BGMI',
            status: 'ongoing',
            participants: 80,
            maxParticipants: 80,
            prizePool: 750,
            date: '2024-01-12'
        },
        {
            id: '3',
            name: 'Free Fire Squad Wars',
            game: 'Free Fire',
            status: 'completed',
            participants: 64,
            maxParticipants: 64,
            prizePool: 400,
            date: '2024-01-10'
        }
    ];
    
    const html = tournaments.map(tournament => `
        <tr>
            <td>${tournament.name}</td>
            <td>${tournament.game}</td>
            <td><span class="tournament-status ${tournament.status}">${tournament.status}</span></td>
            <td>${tournament.participants}/${tournament.maxParticipants}</td>
            <td>$${tournament.prizePool}</td>
            <td>${tournament.date}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editTournament('${tournament.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn view" onclick="viewTournament('${tournament.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteTournament('${tournament.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = html;
}

// Load users data
function loadUsersData() {
    const container = document.getElementById('usersTableBody');
    if (!container) return;
    
    // Update user stats
    const activeUsersEl = document.getElementById('activeUsers');
    const newUsersEl = document.getElementById('newUsers');
    const bannedUsersEl = document.getElementById('bannedUsers');
    
    if (activeUsersEl) activeUsersEl.textContent = '1,250';
    if (newUsersEl) newUsersEl.textContent = '45';
    if (bannedUsersEl) bannedUsersEl.textContent = '3';
    
    // Mock user data
    const users = [
        {
            id: '1',
            name: 'ProGamer123',
            email: 'progamer@example.com',
            tournaments: 12,
            wins: 3,
            status: 'active',
            joinDate: '2024-01-01'
        },
        {
            id: '2',
            name: 'FireMaster',
            email: 'firemaster@example.com',
            tournaments: 8,
            wins: 2,
            status: 'active',
            joinDate: '2024-01-05'
        },
        {
            id: '3',
            name: 'BGMIKing',
            email: 'bgmiking@example.com',
            tournaments: 15,
            wins: 5,
            status: 'active',
            joinDate: '2023-12-20'
        }
    ];
    
    const html = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.tournaments}</td>
            <td>${user.wins}</td>
            <td><span class="user-status ${user.status}">${user.status}</span></td>
            <td>${user.joinDate}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewUser('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="banUser('${user.id}')">
                        <i class="fas fa-ban"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    container.innerHTML = html;
}

// Load analytics data
function loadAnalyticsData() {
    // Initialize analytics charts
    setTimeout(() => {
        initializeAnalyticsCharts();
    }, 100);
}

// Initialize analytics charts
function initializeAnalyticsCharts() {
    if (!window.Chart) return;
    
    // Tournament Growth Chart
    const tournamentGrowthChart = document.getElementById('tournamentGrowthChart');
    if (tournamentGrowthChart) {
        new Chart(tournamentGrowthChart, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Tournaments Created',
                    data: [5, 8, 12, 15, 20, 25],
                    borderColor: '#007bff',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // User Engagement Chart
    const userEngagementChart = document.getElementById('userEngagementChart');
    if (userEngagementChart) {
        new Chart(userEngagementChart, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Active Users',
                    data: [120, 150, 180, 200],
                    backgroundColor: '#28a745'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Game Popularity Chart
    const gamePopularityChart = document.getElementById('gamePopularityChart');
    if (gamePopularityChart) {
        new Chart(gamePopularityChart, {
            type: 'pie',
            data: {
                labels: ['Free Fire', 'BGMI'],
                datasets: [{
                    data: [65, 35],
                    backgroundColor: ['#ff6b6b', '#4834d4']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
    
    // Revenue Chart
    const revenueChart = document.getElementById('revenueChart');
    if (revenueChart) {
        new Chart(revenueChart, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [500, 800, 1200, 1500, 2000, 2500],
                    borderColor: '#dc3545',
                    backgroundColor: 'rgba(220, 53, 69, 0.1)',
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// Load settings data
function loadSettingsData() {
    // Load current settings (mock data)
    const platformNameInput = document.getElementById('platformName');
    const maxParticipantsInput = document.getElementById('maxParticipants');
    const registrationFeeInput = document.getElementById('registrationFee');
    const allowFreeRegistrationInput = document.getElementById('allowFreeRegistration');
    const freeFireEnabledInput = document.getElementById('freeFireEnabled');
    const bgmiEnabledInput = document.getElementById('bgmiEnabled');
    
    if (platformNameInput) platformNameInput.value = 'Tournament Hub';
    if (maxParticipantsInput) maxParticipantsInput.value = '100';
    if (registrationFeeInput) registrationFeeInput.value = '10';
    if (allowFreeRegistrationInput) allowFreeRegistrationInput.checked = true;
    if (freeFireEnabledInput) freeFireEnabledInput.checked = true;
    if (bgmiEnabledInput) bgmiEnabledInput.checked = true;
}

// Handle filter change
function handleFilterChange(e) {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    
    // Reload data based on filter
    const currentSection = document.querySelector('.content-section.active').id;
    loadSectionData(currentSection);
}

// Handle create tournament
async function handleCreateTournament(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tournamentData = {
        tournamentName: formData.get('tournamentName'),
        gameType: formData.get('gameType'),
        maxParticipants: parseInt(formData.get('maxParticipants')),
        entryFee: parseFloat(formData.get('entryFee')),
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        description: formData.get('description'),
        rules: formData.get('rules'),
        firstPrize: parseFloat(formData.get('firstPrize')),
        secondPrize: parseFloat(formData.get('secondPrize')),
        thirdPrize: parseFloat(formData.get('thirdPrize'))
    };
    
    try {
        // Create tournament (mock for demo)
        console.log('Creating tournament:', tournamentData);
        
        // Show success message
        showMessage('Tournament created successfully!', 'success');
        
        // Close modal
        closeModal('createTournamentModal');
        
        // Reset form
        e.target.reset();
        
        // Reload tournaments
        loadTournamentsData();
        
    } catch (error) {
        console.error('Error creating tournament:', error);
        showMessage('Error creating tournament. Please try again.', 'error');
    }
}

// Handle edit tournament
async function handleEditTournament(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tournamentId = formData.get('tournamentId');
    
    try {
        // Update tournament (mock for demo)
        console.log('Updating tournament:', tournamentId);
        
        // Show success message
        showMessage('Tournament updated successfully!', 'success');
        
        // Close modal
        closeModal('editTournamentModal');
        
        // Reload tournaments
        loadTournamentsData();
        
    } catch (error) {
        console.error('Error updating tournament:', error);
        showMessage('Error updating tournament. Please try again.', 'error');
    }
}

// Handle admin authentication
async function handleAdminAuth(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const adminKey = formData.get('adminKey');
    
    try {
        // Verify admin credentials (mock for demo)
        if (adminKey !== 'admin123') {
            showMessage('Invalid admin key', 'error');
            return;
        }
        
        // Sign in admin
        console.log('Admin signing in:', email);
        currentAdmin = { uid: 'admin-user', email: email, displayName: 'Admin User' };
        
        // Show success message
        showMessage('Successfully signed in as admin!', 'success');
        
        // Close modal and load dashboard
        closeModal('adminAuthModal');
        loadAdminDashboard();
        
    } catch (error) {
        console.error('Admin authentication error:', error);
        showMessage('Authentication failed. Please try again.', 'error');
    }
}

// Handle platform settings
async function handlePlatformSettings(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const settings = {
        platformName: formData.get('platformName'),
        maxParticipants: formData.get('maxParticipants'),
        registrationFee: formData.get('registrationFee'),
        allowFreeRegistration: formData.has('allowFreeRegistration')
    };
    
    try {
        // Save settings (mock for demo)
        console.log('Saving settings:', settings);
        
        // Show success message
        showMessage('Settings saved successfully!', 'success');
        
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage('Error saving settings. Please try again.', 'error');
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const currentSection = document.querySelector('.content-section.active').id;
    
    if (currentSection === 'tournaments') {
        const rows = document.querySelectorAll('#tournamentsTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    } else if (currentSection === 'users') {
        const rows = document.querySelectorAll('#usersTableBody tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }
}

// Tournament actions
function editTournament(tournamentId) {
    // Load tournament data into edit form
    console.log('Editing tournament:', tournamentId);
    
    // Show edit modal
    showModal('editTournamentModal');
    
    // Pre-fill form with tournament data (mock)
    const editTournamentId = document.getElementById('editTournamentId');
    if (editTournamentId) {
        editTournamentId.value = tournamentId;
    }
}

function viewTournament(tournamentId) {
    console.log('Viewing tournament:', tournamentId);
    alert(`Viewing tournament details for ID: ${tournamentId}`);
}

function deleteTournament(tournamentId) {
    if (confirm('Are you sure you want to delete this tournament?')) {
        console.log('Deleting tournament:', tournamentId);
        showMessage('Tournament deleted successfully!', 'success');
        loadTournamentsData();
    }
}

// User actions
function viewUser(userId) {
    console.log('Viewing user:', userId);
    alert(`Viewing user details for ID: ${userId}`);
}

function editUser(userId) {
    console.log('Editing user:', userId);
    alert(`Editing user for ID: ${userId}`);
}

function banUser(userId) {
    if (confirm('Are you sure you want to ban this user?')) {
        console.log('Banning user:', userId);
        showMessage('User banned successfully!', 'success');
        loadUsersData();
    }
}

// Export users
function exportUsers() {
    console.log('Exporting users data');
    showMessage('Users data exported successfully!', 'success');
}

// Show create tournament modal
function showCreateTournamentModal() {
    showModal('createTournamentModal');
}

// Show admin auth modal
function showAdminAuthModal() {
    showModal('adminAuthModal');
}

// Show modal
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Close modal
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
    }
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// Logout function
function logout() {
    currentAdmin = null;
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Export functions for global use
window.adminPanel = {
    showCreateTournamentModal,
    showAdminAuthModal,
    editTournament,
    viewTournament,
    deleteTournament,
    viewUser,
    editUser,
    banUser,
    exportUsers,
    showModal,
    closeModal,
    logout
};