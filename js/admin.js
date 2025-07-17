// Admin panel functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    // Set up navigation
    setupAdminNavigation();
    
    // Set up tournament management
    setupTournamentManagement();
    
    // Set up withdrawal management
    setupWithdrawalManagement();
    
    // Set up player management
    setupPlayerManagement();
    
    // Set up reward system
    setupRewardSystem();
}

// Admin navigation setup
function setupAdminNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all nav items
            navItems.forEach(nav => {
                nav.classList.remove('active');
                nav.classList.remove('bg-primary/20', 'border-primary/30', 'text-white');
                nav.classList.add('text-gray-300');
            });
            
            // Add active class to clicked item
            this.classList.add('active');
            this.classList.remove('text-gray-300');
            this.classList.add('bg-primary/20', 'border-primary/30', 'text-white');
            
            // Get the page to show
            const pageToShow = this.getAttribute('data-page');
            showAdminPage(pageToShow);
        });
    });
}

// Show specific admin page
function showAdminPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    
    // Show selected page
    const pageId = pageName + 'Page';
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
    
    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    pageTitle.textContent = pageName.charAt(0).toUpperCase() + pageName.slice(1);
    
    // Load page-specific data
    switch(pageName) {
        case 'tournaments':
            loadTournaments();
            break;
        case 'withdrawals':
            loadWithdrawals();
            break;
        case 'players':
            loadPlayers();
            break;
        case 'dashboard':
            window.loadDashboardData();
            break;
    }
}

// Tournament management setup
function setupTournamentManagement() {
    const createTournamentBtn = document.getElementById('createTournamentBtn');
    const createTournamentModal = document.getElementById('createTournamentModal');
    const tournamentForm = document.getElementById('tournamentForm');
    const cancelTournament = document.getElementById('cancelTournament');
    
    if (createTournamentBtn) {
        createTournamentBtn.addEventListener('click', function() {
            createTournamentModal.classList.remove('hidden');
        });
    }
    
    if (cancelTournament) {
        cancelTournament.addEventListener('click', function() {
            createTournamentModal.classList.add('hidden');
            tournamentForm.reset();
        });
    }
    
    if (tournamentForm) {
        tournamentForm.addEventListener('submit', handleTournamentCreation);
    }
    
    // Close modal when clicking outside
    if (createTournamentModal) {
        createTournamentModal.addEventListener('click', function(e) {
            if (e.target === createTournamentModal) {
                createTournamentModal.classList.add('hidden');
                tournamentForm.reset();
            }
        });
    }
}

// Handle tournament creation
async function handleTournamentCreation(e) {
    e.preventDefault();
    
    const name = document.getElementById('tournamentName').value;
    const game = document.getElementById('tournamentGame').value;
    const prize = parseInt(document.getElementById('tournamentPrize').value);
    const maxPlayers = parseInt(document.getElementById('tournamentMaxPlayers').value);
    
    if (!name || !game || !prize || !maxPlayers) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const tournamentData = {
            name,
            game,
            prize,
            maxPlayers,
            createdBy: window.currentAdmin().uid
        };
        
        const tournamentId = await dbHelpers.createTournament(tournamentData);
        
        if (tournamentId) {
            showNotification('Tournament created successfully!', 'success');
            document.getElementById('createTournamentModal').classList.add('hidden');
            document.getElementById('tournamentForm').reset();
            loadTournaments();
        } else {
            showNotification('Failed to create tournament', 'error');
        }
    } catch (error) {
        console.error('Tournament creation error:', error);
        showNotification('An error occurred while creating tournament', 'error');
    }
}

// Load tournaments
async function loadTournaments() {
    try {
        const tournaments = await dbHelpers.getTournaments();
        const tournamentsList = document.getElementById('tournamentsList');
        
        if (Object.keys(tournaments).length === 0) {
            tournamentsList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-trophy text-4xl mb-4"></i>
                    <p>No tournaments found</p>
                </div>
            `;
            return;
        }
        
        tournamentsList.innerHTML = '';
        
        Object.entries(tournaments).forEach(([id, tournament]) => {
            const tournamentItem = document.createElement('div');
            tournamentItem.className = 'bg-black/20 rounded-lg p-6 border border-white/10';
            tournamentItem.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-xl font-bold text-white">${tournament.name}</h4>
                        <p class="text-gray-400">${tournament.game.toUpperCase()}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-yellow-400 font-semibold">${tournament.prize} Coins</p>
                        <p class="text-gray-400 text-sm">${Object.keys(tournament.participants || {}).length}/${tournament.maxPlayers} players</p>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                        tournament.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        tournament.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                    }">
                        ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                    </span>
                    <div class="space-x-2">
                        <button class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded text-sm transition-colors">
                            View Details
                        </button>
                        <button class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-1 rounded text-sm transition-colors">
                            Delete
                        </button>
                    </div>
                </div>
            `;
            tournamentsList.appendChild(tournamentItem);
        });
        
    } catch (error) {
        console.error('Error loading tournaments:', error);
        showNotification('Error loading tournaments', 'error');
    }
}

// Withdrawal management setup
function setupWithdrawalManagement() {
    // Will be set up when withdrawals are loaded
}

// Load withdrawals
async function loadWithdrawals() {
    try {
        const withdrawals = await dbHelpers.getWithdrawals();
        const withdrawalsList = document.getElementById('withdrawalsList');
        
        if (Object.keys(withdrawals).length === 0) {
            withdrawalsList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-wallet text-4xl mb-4"></i>
                    <p>No withdrawal requests</p>
                </div>
            `;
            return;
        }
        
        withdrawalsList.innerHTML = '';
        
        // Sort withdrawals by creation date (newest first)
        const sortedWithdrawals = Object.entries(withdrawals)
            .sort(([,a], [,b]) => b.createdAt - a.createdAt);
        
        sortedWithdrawals.forEach(([id, withdrawal]) => {
            const withdrawalItem = document.createElement('div');
            withdrawalItem.className = 'bg-black/20 rounded-lg p-6 border border-white/10';
            withdrawalItem.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h4 class="text-lg font-bold text-white">${withdrawal.userName}</h4>
                        <p class="text-gray-400">${withdrawal.userEmail}</p>
                        <p class="text-gray-400 text-sm">${formatTimestamp(withdrawal.createdAt)}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-yellow-400 font-semibold text-xl">${withdrawal.amount} Coins</p>
                        <p class="text-gray-400 text-sm">${withdrawal.method.toUpperCase()}</p>
                    </div>
                </div>
                <div class="bg-white/5 rounded-lg p-3 mb-4">
                    <p class="text-gray-300 text-sm"><strong>Payment Details:</strong></p>
                    <p class="text-white">${withdrawal.details}</p>
                </div>
                <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold ${
                        withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                    }">
                        ${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                    ${withdrawal.status === 'pending' ? `
                        <div class="space-x-2">
                            <button onclick="updateWithdrawalStatus('${id}', 'approved')" class="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded text-sm transition-colors">
                                Approve
                            </button>
                            <button onclick="updateWithdrawalStatus('${id}', 'rejected')" class="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded text-sm transition-colors">
                                Reject
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            withdrawalsList.appendChild(withdrawalItem);
        });
        
    } catch (error) {
        console.error('Error loading withdrawals:', error);
        showNotification('Error loading withdrawals', 'error');
    }
}

// Update withdrawal status
async function updateWithdrawalStatus(withdrawalId, status) {
    try {
        const success = await dbHelpers.updateWithdrawalStatus(withdrawalId, status);
        
        if (success) {
            showNotification(`Withdrawal ${status} successfully!`, 'success');
            loadWithdrawals(); // Reload withdrawals
            window.loadDashboardData(); // Update dashboard stats
        } else {
            showNotification('Failed to update withdrawal status', 'error');
        }
    } catch (error) {
        console.error('Error updating withdrawal status:', error);
        showNotification('An error occurred while updating withdrawal', 'error');
    }
}

// Player management setup
function setupPlayerManagement() {
    // Will be set up when players are loaded
}

// Load players
async function loadPlayers() {
    try {
        const users = await dbHelpers.getAllUsers();
        const playersList = document.getElementById('playersList');
        
        if (Object.keys(users).length === 0) {
            playersList.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>No players found</p>
                </div>
            `;
            return;
        }
        
        playersList.innerHTML = '';
        
        // Sort players by last login (newest first)
        const sortedPlayers = Object.entries(users)
            .sort(([,a], [,b]) => (b.lastLogin || 0) - (a.lastLogin || 0));
        
        sortedPlayers.forEach(([uid, user]) => {
            const playerItem = document.createElement('div');
            playerItem.className = 'bg-black/20 rounded-lg p-6 border border-white/10';
            playerItem.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center space-x-4">
                        <img src="${user.photoURL || '/api/placeholder/48/48'}" alt="Avatar" class="w-12 h-12 rounded-full">
                        <div>
                            <h4 class="text-lg font-bold text-white">${user.displayName || 'Unknown'}</h4>
                            <p class="text-gray-400">${user.email}</p>
                            <p class="text-gray-400 text-sm">ID: ${user.playerId}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-yellow-400 font-semibold">${user.coins || 0} Coins</p>
                        <p class="text-gray-400 text-sm">${user.referralCount || 0} Referrals</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-white/5 rounded-lg p-3">
                        <p class="text-gray-400 text-sm">Joined</p>
                        <p class="text-white text-sm">${formatTimestamp(user.createdAt)}</p>
                    </div>
                    <div class="bg-white/5 rounded-lg p-3">
                        <p class="text-gray-400 text-sm">Last Login</p>
                        <p class="text-white text-sm">${user.lastLogin ? formatTimestamp(user.lastLogin) : 'Never'}</p>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        Active
                    </span>
                    <div class="space-x-2">
                        <button onclick="sendRewardToPlayer('${uid}')" class="bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded text-sm transition-colors">
                            Send Reward
                        </button>
                        <button class="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-1 rounded text-sm transition-colors">
                            View Details
                        </button>
                    </div>
                </div>
            `;
            playersList.appendChild(playerItem);
        });
        
    } catch (error) {
        console.error('Error loading players:', error);
        showNotification('Error loading players', 'error');
    }
}

// Send reward to specific player
function sendRewardToPlayer(uid) {
    // Switch to rewards page and pre-fill the player ID
    showAdminPage('rewards');
    document.getElementById('rewardPlayerId').value = uid;
    
    // Update navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(nav => {
        nav.classList.remove('active', 'bg-primary/20', 'border-primary/30', 'text-white');
        nav.classList.add('text-gray-300');
    });
    
    const rewardsNav = document.querySelector('[data-page="rewards"]');
    if (rewardsNav) {
        rewardsNav.classList.add('active', 'bg-primary/20', 'border-primary/30', 'text-white');
        rewardsNav.classList.remove('text-gray-300');
    }
}

// Reward system setup
function setupRewardSystem() {
    const rewardForm = document.getElementById('rewardForm');
    
    if (rewardForm) {
        rewardForm.addEventListener('submit', handleRewardSubmission);
    }
}

// Handle reward submission
async function handleRewardSubmission(e) {
    e.preventDefault();
    
    const playerIdOrEmail = document.getElementById('rewardPlayerId').value;
    const amount = parseInt(document.getElementById('rewardAmount').value);
    const reason = document.getElementById('rewardReason').value;
    
    if (!playerIdOrEmail || !amount || !reason) {
        showNotification('Please fill in all fields', 'error');
        return;
    }
    
    if (amount <= 0) {
        showNotification('Reward amount must be positive', 'error');
        return;
    }
    
    try {
        // Find user by ID or email
        const users = await dbHelpers.getAllUsers();
        let targetUid = null;
        
        // Check if it's a UID (exact match)
        if (users[playerIdOrEmail]) {
            targetUid = playerIdOrEmail;
        } else {
            // Search by player ID or email
            for (const [uid, user] of Object.entries(users)) {
                if (user.playerId === playerIdOrEmail || user.email === playerIdOrEmail) {
                    targetUid = uid;
                    break;
                }
            }
        }
        
        if (!targetUid) {
            showNotification('Player not found', 'error');
            return;
        }
        
        const success = await dbHelpers.sendReward(targetUid, amount, reason);
        
        if (success) {
            showNotification('Reward sent successfully!', 'success');
            document.getElementById('rewardForm').reset();
            window.loadDashboardData(); // Update dashboard stats
        } else {
            showNotification('Failed to send reward', 'error');
        }
    } catch (error) {
        console.error('Reward sending error:', error);
        showNotification('An error occurred while sending reward', 'error');
    }
}

// Make functions globally available
window.updateWithdrawalStatus = updateWithdrawalStatus;
window.sendRewardToPlayer = sendRewardToPlayer;