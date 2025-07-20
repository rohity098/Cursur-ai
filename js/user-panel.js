// User Panel JavaScript
document.addEventListener('DOMContentLoaded', function() {
    initializeUserPanel();
    setupEventListeners();
    checkAuthState();
});

let currentUser = null;
let isAuthModalMode = 'login'; // 'login' or 'signup'

// Initialize user panel
function initializeUserPanel() {
    console.log('User Panel Initialized');
    
    // Set up navigation
    setupNavigation();
    
    // Show auth modal if user is not logged in
    if (!window.firebaseUtils || !window.firebaseUtils.auth.currentUser) {
        showAuthModal();
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
    
    // Tab buttons
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', handleTabChange);
    });
    
    // Forms
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    const joinTournamentForm = document.getElementById('joinTournamentForm');
    if (joinTournamentForm) {
        joinTournamentForm.addEventListener('submit', handleJoinTournament);
    }
    
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuth);
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

// Check authentication state
function checkAuthState() {
    if (window.firebaseUtils && window.firebaseUtils.auth) {
        window.firebaseUtils.auth.onAuthStateChanged((user) => {
            if (user) {
                currentUser = user;
                closeModal('authModal');
                loadUserDashboard();
            } else {
                currentUser = null;
                showAuthModal();
            }
        });
    } else {
        // Mock user for demo
        setTimeout(() => {
            currentUser = { uid: 'demo-user', email: 'demo@example.com', displayName: 'Demo User' };
            loadUserDashboard();
        }, 1000);
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
            loadAllTournaments();
            break;
        case 'my-tournaments':
            loadMyTournaments();
            break;
        case 'profile':
            loadProfileData();
            break;
        case 'leaderboard':
            loadLeaderboard();
            break;
    }
}

// Load user dashboard
async function loadUserDashboard() {
    try {
        // Update user info in sidebar
        updateUserInfo();
        
        // Load dashboard data
        loadDashboardData();
        
        // Load recent and upcoming tournaments
        loadRecentTournaments();
        loadUpcomingTournaments();
        
    } catch (error) {
        console.error('Error loading user dashboard:', error);
    }
}

// Update user info
function updateUserInfo() {
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    
    if (currentUser) {
        if (userNameEl) userNameEl.textContent = currentUser.displayName || 'User';
        if (userEmailEl) userEmailEl.textContent = currentUser.email || '';
    }
}

// Load dashboard data
function loadDashboardData() {
    // Load user stats (mock data for demo)
    const stats = {
        tournamentsJoined: 12,
        wins: 3,
        points: 1250,
        winRate: 25
    };
    
    const totalTournaments = document.getElementById('totalTournaments');
    const totalWins = document.getElementById('totalWins');
    const totalPoints = document.getElementById('totalPoints');
    const winRate = document.getElementById('winRate');
    
    if (totalTournaments) totalTournaments.textContent = stats.tournamentsJoined;
    if (totalWins) totalWins.textContent = stats.wins;
    if (totalPoints) totalPoints.textContent = stats.points;
    if (winRate) winRate.textContent = stats.winRate + '%';
}

// Load recent tournaments
function loadRecentTournaments() {
    const container = document.getElementById('recentTournaments');
    if (!container) return;
    
    // Mock data for demo
    const tournaments = [
        { name: 'Free Fire Championship', status: 'completed', result: 'Won' },
        { name: 'BGMI Battle Royale', status: 'completed', result: '3rd Place' },
        { name: 'Free Fire Squad Wars', status: 'completed', result: '5th Place' }
    ];
    
    const html = tournaments.map(tournament => `
        <div class="tournament-item">
            <div class="tournament-info">
                <h4>${tournament.name}</h4>
                <p>Status: ${tournament.status} - ${tournament.result}</p>
            </div>
            <div class="tournament-status ${tournament.status}">
                ${tournament.status}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Load upcoming tournaments
function loadUpcomingTournaments() {
    const container = document.getElementById('upcomingTournaments');
    if (!container) return;
    
    // Mock data for demo
    const tournaments = [
        { name: 'Free Fire Blitz', date: '2024-01-15', status: 'registered' },
        { name: 'BGMI Pro League', date: '2024-01-20', status: 'open' }
    ];
    
    const html = tournaments.map(tournament => `
        <div class="tournament-item">
            <div class="tournament-info">
                <h4>${tournament.name}</h4>
                <p>Date: ${tournament.date}</p>
            </div>
            <div class="tournament-status ${tournament.status}">
                ${tournament.status}
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Load all tournaments
async function loadAllTournaments() {
    const container = document.getElementById('allTournaments');
    if (!container) return;
    
    try {
        container.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading tournaments...</div>';
        
        // Get tournaments (mock data for demo)
        const tournaments = getMockTournaments();
        
        if (tournaments.length > 0) {
            renderTournamentCards(tournaments, container);
        } else {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><h3>No tournaments available</h3></div>';
        }
    } catch (error) {
        console.error('Error loading tournaments:', error);
        container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading tournaments</h3></div>';
    }
}

// Get mock tournaments
function getMockTournaments() {
    return [
        {
            id: '1',
            tournamentName: 'Free Fire Championship',
            gameType: 'freefire',
            status: 'open',
            maxParticipants: 100,
            participantCount: 45,
            entryFee: 10,
            firstPrize: 500,
            startDate: new Date('2024-01-15'),
            description: 'Ultimate Free Fire championship'
        },
        {
            id: '2',
            tournamentName: 'BGMI Battle Royale',
            gameType: 'bgmi',
            status: 'open',
            maxParticipants: 80,
            participantCount: 32,
            entryFee: 15,
            firstPrize: 750,
            startDate: new Date('2024-01-18'),
            description: 'Epic BGMI tournament'
        },
        {
            id: '3',
            tournamentName: 'Free Fire Squad Wars',
            gameType: 'freefire',
            status: 'ongoing',
            maxParticipants: 64,
            participantCount: 64,
            entryFee: 8,
            firstPrize: 400,
            startDate: new Date('2024-01-12'),
            description: 'Squad-based Free Fire tournament'
        }
    ];
}

// Render tournament cards
function renderTournamentCards(tournaments, container) {
    const html = tournaments.map(tournament => `
        <div class="tournament-card">
            <div class="tournament-header">
                <h3>${tournament.tournamentName}</h3>
                <div class="tournament-game ${tournament.gameType}">
                    ${tournament.gameType.toUpperCase()}
                </div>
            </div>
            <div class="tournament-details">
                <div class="tournament-detail">
                    <span>Participants:</span>
                    <span>${tournament.participantCount}/${tournament.maxParticipants}</span>
                </div>
                <div class="tournament-detail">
                    <span>Entry Fee:</span>
                    <span>$${tournament.entryFee}</span>
                </div>
                <div class="tournament-detail">
                    <span>Prize:</span>
                    <span>$${tournament.firstPrize}</span>
                </div>
                <div class="tournament-detail">
                    <span>Date:</span>
                    <span>${tournament.startDate.toLocaleDateString()}</span>
                </div>
            </div>
            <div class="tournament-status ${tournament.status}">
                ${tournament.status.toUpperCase()}
            </div>
            <p>${tournament.description}</p>
            <div class="tournament-actions">
                ${tournament.status === 'open' ? 
                    `<button class="btn btn-primary" onclick="joinTournamentById('${tournament.id}')">
                        <i class="fas fa-plus"></i> Join
                    </button>` : 
                    `<button class="btn btn-secondary" disabled>
                        <i class="fas fa-lock"></i> ${tournament.status}
                    </button>`
                }
                <button class="btn btn-outline" onclick="viewTournamentDetails('${tournament.id}')">
                    <i class="fas fa-eye"></i> Details
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Load my tournaments
function loadMyTournaments() {
    const container = document.getElementById('myTournamentsContent');
    if (!container) return;
    
    // Mock data for demo
    const myTournaments = [
        {
            id: '1',
            tournamentName: 'Free Fire Championship',
            gameType: 'freefire',
            status: 'registered',
            joinDate: new Date('2024-01-10'),
            result: 'Pending'
        },
        {
            id: '2',
            tournamentName: 'BGMI Battle Royale',
            gameType: 'bgmi',
            status: 'completed',
            joinDate: new Date('2024-01-05'),
            result: '3rd Place'
        }
    ];
    
    renderTournamentCards(myTournaments, container);
}

// Load profile data
function loadProfileData() {
    if (!currentUser) return;
    
    // Update profile form with current user data
    const displayNameInput = document.getElementById('displayName');
    const gameIdInput = document.getElementById('gameId');
    const bgmiIdInput = document.getElementById('bgmiId');
    const phoneInput = document.getElementById('phone');
    const countrySelect = document.getElementById('country');
    
    if (displayNameInput) displayNameInput.value = currentUser.displayName || '';
    if (gameIdInput) gameIdInput.value = ''; // Load from user data
    if (bgmiIdInput) bgmiIdInput.value = ''; // Load from user data
    if (phoneInput) phoneInput.value = ''; // Load from user data
    if (countrySelect) countrySelect.value = ''; // Load from user data
    
    // Update profile header
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    
    if (profileNameEl) profileNameEl.textContent = currentUser.displayName || 'User';
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email || '';
}

// Load leaderboard
function loadLeaderboard() {
    const container = document.getElementById('leaderboardTable');
    if (!container) return;
    
    // Mock leaderboard data
    const leaderboard = [
        { rank: 1, name: 'ProGamer123', points: 2500, wins: 15, tournaments: 25 },
        { rank: 2, name: 'FireMaster', points: 2300, wins: 12, tournaments: 20 },
        { rank: 3, name: 'BGMIKing', points: 2100, wins: 10, tournaments: 18 },
        { rank: 4, name: 'SquadLeader', points: 1900, wins: 8, tournaments: 16 },
        { rank: 5, name: 'TournamentPro', points: 1750, wins: 7, tournaments: 15 }
    ];
    
    const html = `
        <table>
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>Points</th>
                    <th>Wins</th>
                    <th>Tournaments</th>
                </tr>
            </thead>
            <tbody>
                ${leaderboard.map(player => `
                    <tr>
                        <td><span class="leaderboard-rank ${player.rank <= 3 ? (player.rank === 1 ? 'gold' : player.rank === 2 ? 'silver' : 'bronze') : ''}">${player.rank}</span></td>
                        <td>${player.name}</td>
                        <td>${player.points}</td>
                        <td>${player.wins}</td>
                        <td>${player.tournaments}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

// Handle filter change
function handleFilterChange(e) {
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    
    // Reload tournaments with filter
    loadAllTournaments();
}

// Handle tab change
function handleTabChange(e) {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => btn.classList.remove('active'));
    e.target.classList.add('active');
    
    // Load filtered my tournaments
    loadMyTournaments();
}

// Handle profile update
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const profileData = {
        displayName: formData.get('displayName'),
        gameId: formData.get('gameId'),
        bgmiId: formData.get('bgmiId'),
        phone: formData.get('phone'),
        country: formData.get('country')
    };
    
    try {
        // Update profile in Firebase (mock for demo)
        console.log('Updating profile:', profileData);
        
        // Show success message
        showMessage('Profile updated successfully!', 'success');
        
        // Update current user data
        if (currentUser) {
            currentUser.displayName = profileData.displayName;
            updateUserInfo();
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        showMessage('Error updating profile. Please try again.', 'error');
    }
}

// Handle join tournament
async function handleJoinTournament(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const tournamentData = {
        tournamentCode: formData.get('tournamentCode'),
        teamName: formData.get('teamName'),
        gameId: formData.get('gameIdModal')
    };
    
    try {
        // Join tournament (mock for demo)
        console.log('Joining tournament:', tournamentData);
        
        // Show success message
        showMessage('Successfully joined tournament!', 'success');
        
        // Close modal
        closeModal('joinTournamentModal');
        
        // Reset form
        e.target.reset();
        
        // Reload tournaments
        loadAllTournaments();
        loadMyTournaments();
    } catch (error) {
        console.error('Error joining tournament:', error);
        showMessage('Error joining tournament. Please try again.', 'error');
    }
}

// Handle authentication
async function handleAuth(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    try {
        if (isAuthModalMode === 'signup') {
            if (password !== confirmPassword) {
                showMessage('Passwords do not match', 'error');
                return;
            }
            
            // Sign up (mock for demo)
            console.log('Signing up:', email);
            currentUser = { uid: 'new-user', email: email, displayName: email.split('@')[0] };
            
        } else {
            // Sign in (mock for demo)
            console.log('Signing in:', email);
            currentUser = { uid: 'demo-user', email: email, displayName: email.split('@')[0] };
        }
        
        // Show success message
        showMessage(`Successfully ${isAuthModalMode === 'signup' ? 'signed up' : 'signed in'}!`, 'success');
        
        // Close modal and load dashboard
        closeModal('authModal');
        loadUserDashboard();
        
    } catch (error) {
        console.error('Authentication error:', error);
        showMessage('Authentication failed. Please try again.', 'error');
    }
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const tournamentCards = document.querySelectorAll('.tournament-card');
    
    tournamentCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const description = card.querySelector('p').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Show join tournament modal
function showJoinTournamentModal() {
    showModal('joinTournamentModal');
}

// Show auth modal
function showAuthModal() {
    showModal('authModal');
}

// Switch auth mode
function switchAuthMode() {
    isAuthModalMode = isAuthModalMode === 'login' ? 'signup' : 'login';
    
    const authTitle = document.getElementById('authTitle');
    const authSubmitBtn = document.getElementById('authSubmitBtn');
    const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
    const authSwitchText = document.getElementById('authSwitchText');
    
    if (isAuthModalMode === 'signup') {
        authTitle.textContent = 'Sign Up';
        authSubmitBtn.textContent = 'Sign Up';
        confirmPasswordGroup.style.display = 'block';
        authSwitchText.innerHTML = 'Already have an account? <a href="#" onclick="switchAuthMode()">Sign in</a>';
    } else {
        authTitle.textContent = 'Login';
        authSubmitBtn.textContent = 'Login';
        confirmPasswordGroup.style.display = 'none';
        authSwitchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="switchAuthMode()">Sign up</a>';
    }
}

// Join tournament by ID
function joinTournamentById(tournamentId) {
    // Pre-fill tournament code if available
    const tournamentCodeInput = document.getElementById('tournamentCode');
    if (tournamentCodeInput) {
        tournamentCodeInput.value = tournamentId;
    }
    
    showJoinTournamentModal();
}

// View tournament details
function viewTournamentDetails(tournamentId) {
    // For demo, show alert
    alert(`Viewing details for tournament: ${tournamentId}`);
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
    currentUser = null;
    showMessage('Logged out successfully', 'success');
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Export functions for global use
window.userPanel = {
    showJoinTournamentModal,
    showAuthModal,
    switchAuthMode,
    joinTournamentById,
    viewTournamentDetails,
    showModal,
    closeModal,
    logout
};