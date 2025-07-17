// Firebase Configuration
const firebaseConfig = {
    apiKey: "your-api-key-here",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase services
const auth = firebase.auth();
const database = firebase.database();

// Configure Google Sign-In
const provider = new firebase.auth.GoogleAuthProvider();
provider.addScope('profile');
provider.addScope('email');

// Admin email list (you can add multiple admin emails here)
const ADMIN_EMAILS = [
    'admin@example.com',
    'admin2@example.com'
];

// Check if user is admin
function isAdmin(email) {
    return ADMIN_EMAILS.includes(email);
}

// Utility functions
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
    
    // Set notification style based on type
    switch(type) {
        case 'success':
            notification.className += ' bg-green-500/20 border border-green-500/30 text-green-400';
            break;
        case 'error':
            notification.className += ' bg-red-500/20 border border-red-500/30 text-red-400';
            break;
        case 'warning':
            notification.className += ' bg-yellow-500/20 border border-yellow-500/30 text-yellow-400';
            break;
        default:
            notification.className += ' bg-blue-500/20 border border-blue-500/30 text-blue-400';
    }
    
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy to clipboard', 'error');
    });
}

// Get referral ID from URL
function getReferralIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// Database helper functions
const dbHelpers = {
    // User operations
    async createUser(uid, userData) {
        try {
            await database.ref(`users/${uid}`).set({
                ...userData,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                coins: 0,
                referralCount: 0,
                referralEarnings: 0
            });
            return true;
        } catch (error) {
            console.error('Error creating user:', error);
            return false;
        }
    },

    async getUserData(uid) {
        try {
            const snapshot = await database.ref(`users/${uid}`).once('value');
            return snapshot.val();
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    },

    async updateUserCoins(uid, coins) {
        try {
            await database.ref(`users/${uid}/coins`).set(coins);
            return true;
        } catch (error) {
            console.error('Error updating user coins:', error);
            return false;
        }
    },

    // Withdrawal operations
    async createWithdrawal(uid, withdrawalData) {
        try {
            const withdrawalId = generateId();
            await database.ref(`withdrawals/${withdrawalId}`).set({
                ...withdrawalData,
                uid,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return withdrawalId;
        } catch (error) {
            console.error('Error creating withdrawal:', error);
            return null;
        }
    },

    async getWithdrawals() {
        try {
            const snapshot = await database.ref('withdrawals').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting withdrawals:', error);
            return {};
        }
    },

    async updateWithdrawalStatus(withdrawalId, status) {
        try {
            await database.ref(`withdrawals/${withdrawalId}/status`).set(status);
            return true;
        } catch (error) {
            console.error('Error updating withdrawal status:', error);
            return false;
        }
    },

    // Referral operations
    async createReferral(referrerId, referredUid, referredData) {
        try {
            const referralId = generateId();
            await database.ref(`referrals/${referralId}`).set({
                referrerId,
                referredUid,
                referredData,
                reward: 50, // 50 coins per referral
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Update referrer's stats
            const referrerData = await this.getUserData(referrerId);
            if (referrerData) {
                await database.ref(`users/${referrerId}`).update({
                    referralCount: (referrerData.referralCount || 0) + 1,
                    referralEarnings: (referrerData.referralEarnings || 0) + 50,
                    coins: (referrerData.coins || 0) + 50
                });
            }

            return referralId;
        } catch (error) {
            console.error('Error creating referral:', error);
            return null;
        }
    },

    async getReferrals(uid) {
        try {
            const snapshot = await database.ref('referrals').orderByChild('referrerId').equalTo(uid).once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting referrals:', error);
            return {};
        }
    },

    // Tournament operations
    async createTournament(tournamentData) {
        try {
            const tournamentId = generateId();
            await database.ref(`tournaments/${tournamentId}`).set({
                ...tournamentData,
                id: tournamentId,
                status: 'active',
                participants: {},
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return tournamentId;
        } catch (error) {
            console.error('Error creating tournament:', error);
            return null;
        }
    },

    async getTournaments() {
        try {
            const snapshot = await database.ref('tournaments').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting tournaments:', error);
            return {};
        }
    },

    // Admin operations
    async getAllUsers() {
        try {
            const snapshot = await database.ref('users').once('value');
            return snapshot.val() || {};
        } catch (error) {
            console.error('Error getting all users:', error);
            return {};
        }
    },

    async sendReward(uid, amount, reason) {
        try {
            const userData = await this.getUserData(uid);
            if (!userData) return false;

            const rewardId = generateId();
            await database.ref(`rewards/${rewardId}`).set({
                uid,
                amount,
                reason,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });

            // Update user coins
            await this.updateUserCoins(uid, (userData.coins || 0) + amount);
            return true;
        } catch (error) {
            console.error('Error sending reward:', error);
            return false;
        }
    }
};

// Export for use in other files
window.dbHelpers = dbHelpers;