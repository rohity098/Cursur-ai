// Admin authentication state management
let currentAdmin = null;

// DOM elements
const loadingScreen = document.getElementById('loading');
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const googleSignInBtn = document.getElementById('googleSignIn');
const logoutBtn = document.getElementById('logoutBtn');
const accessDenied = document.getElementById('accessDenied');

// Initialize admin authentication
document.addEventListener('DOMContentLoaded', function() {
    // Show loading screen initially
    loadingScreen.classList.remove('hidden');
    
    // Set up Google Sign-In
    googleSignInBtn.addEventListener('click', signInWithGoogle);
    
    // Set up logout
    logoutBtn.addEventListener('click', signOut);
    
    // Listen for auth state changes
    auth.onAuthStateChanged(handleAuthStateChange);
});

// Handle authentication state changes
async function handleAuthStateChange(user) {
    if (user) {
        // Check if user is admin
        if (isAdmin(user.email)) {
            currentAdmin = user;
            showAdminPanel();
        } else {
            // User is not admin, show access denied
            showAccessDenied();
            // Sign out the user
            setTimeout(() => {
                auth.signOut();
            }, 2000);
        }
    } else {
        currentAdmin = null;
        showLoginScreen();
    }
}

// Sign in with Google
async function signInWithGoogle() {
    try {
        googleSignInBtn.disabled = true;
        googleSignInBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing in...';
        
        const result = await auth.signInWithPopup(provider);
        // User will be handled by onAuthStateChanged
    } catch (error) {
        console.error('Admin sign-in error:', error);
        showNotification('Sign-in failed. Please try again.', 'error');
        
        // Reset button
        googleSignInBtn.disabled = false;
        googleSignInBtn.innerHTML = `
            <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Sign in with Google</span>
        `;
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Admin sign-out error:', error);
        showNotification('Sign-out failed', 'error');
    }
}

// Show login screen
function showLoginScreen() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    accessDenied.classList.add('hidden');
}

// Show access denied
function showAccessDenied() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    adminPanel.classList.add('hidden');
    accessDenied.classList.remove('hidden');
}

// Show admin panel
function showAdminPanel() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    adminPanel.classList.remove('hidden');
    
    // Update admin UI
    updateAdminInterface();
}

// Update admin interface
function updateAdminInterface() {
    if (!currentAdmin) return;
    
    // Update admin profile
    document.getElementById('adminAvatar').src = currentAdmin.photoURL || '/api/placeholder/48/48';
    document.getElementById('adminName').textContent = currentAdmin.displayName || 'Admin';
    
    // Load admin dashboard data
    loadDashboardData();
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load stats
        const users = await dbHelpers.getAllUsers();
        const tournaments = await dbHelpers.getTournaments();
        const withdrawals = await dbHelpers.getWithdrawals();
        
        // Update stats
        document.getElementById('totalPlayers').textContent = Object.keys(users).length;
        document.getElementById('activeTournaments').textContent = Object.values(tournaments).filter(t => t.status === 'active').length;
        document.getElementById('pendingWithdrawals').textContent = Object.values(withdrawals).filter(w => w.status === 'pending').length;
        
        // Calculate total coins distributed
        const totalCoins = Object.values(users).reduce((total, user) => total + (user.coins || 0), 0);
        document.getElementById('totalCoinsDistributed').textContent = totalCoins;
        
        // Load recent activity
        loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const recentActivity = document.getElementById('recentActivity');
        
        // Get recent withdrawals
        const withdrawals = await dbHelpers.getWithdrawals();
        const recentWithdrawals = Object.entries(withdrawals)
            .sort(([,a], [,b]) => b.createdAt - a.createdAt)
            .slice(0, 5);
        
        if (recentWithdrawals.length === 0) {
            recentActivity.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-chart-line text-4xl mb-4"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }
        
        recentActivity.innerHTML = '';
        
        recentWithdrawals.forEach(([id, withdrawal]) => {
            const activityItem = document.createElement('div');
            activityItem.className = 'bg-black/20 rounded-lg p-4 flex items-center justify-between';
            activityItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="bg-yellow-500/20 p-2 rounded-full">
                        <i class="fas fa-wallet text-yellow-400"></i>
                    </div>
                    <div>
                        <p class="text-white font-semibold">Withdrawal Request</p>
                        <p class="text-gray-400 text-sm">${withdrawal.userName} - ${withdrawal.amount} coins</p>
                        <p class="text-gray-400 text-xs">${formatTimestamp(withdrawal.createdAt)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <span class="px-2 py-1 rounded-full text-xs font-semibold ${
                        withdrawal.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        withdrawal.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                        'bg-red-500/20 text-red-400'
                    }">
                        ${withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                    </span>
                </div>
            `;
            recentActivity.appendChild(activityItem);
        });
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Set up real-time updates for admin data
function setupAdminRealtimeUpdates() {
    if (!currentAdmin) return;
    
    // Listen for changes in withdrawals
    database.ref('withdrawals').on('value', () => {
        loadDashboardData();
    });
    
    // Listen for changes in users
    database.ref('users').on('value', () => {
        loadDashboardData();
    });
    
    // Listen for changes in tournaments
    database.ref('tournaments').on('value', () => {
        loadDashboardData();
    });
}

// Clean up listeners when admin signs out
auth.onAuthStateChanged((user) => {
    if (user && isAdmin(user.email)) {
        setupAdminRealtimeUpdates();
    } else {
        // Clean up listeners
        database.ref('withdrawals').off();
        database.ref('users').off();
        database.ref('tournaments').off();
    }
});

// Export for use in other files
window.currentAdmin = () => currentAdmin;
window.loadDashboardData = loadDashboardData;