// Firebase Configuration
const firebaseConfig = {
    // Replace with your Firebase project configuration
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Collection references
const collections = {
    users: db.collection('users'),
    tournaments: db.collection('tournaments'),
    participants: db.collection('participants'),
    results: db.collection('results'),
    settings: db.collection('settings')
};

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('User signed in:', user.uid);
        // User is signed in
        if (window.location.pathname.includes('admin-panel.html')) {
            checkAdminAccess(user);
        } else if (window.location.pathname.includes('user-panel.html')) {
            loadUserData(user);
        }
    } else {
        console.log('User signed out');
        // User is signed out
        if (window.location.pathname.includes('panel.html')) {
            showAuthModal();
        }
    }
});

// Check if user has admin access
async function checkAdminAccess(user) {
    try {
        const userDoc = await collections.users.doc(user.uid).get();
        if (userDoc.exists && userDoc.data().role === 'admin') {
            console.log('Admin access granted');
            loadAdminData();
        } else {
            console.log('Admin access denied');
            alert('You do not have admin access. Redirecting to home page.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error checking admin access:', error);
        alert('Error checking admin access. Please try again.');
        window.location.href = 'index.html';
    }
}

// Load user data
async function loadUserData(user) {
    try {
        const userDoc = await collections.users.doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            updateUserUI(userData);
        } else {
            // Create new user document
            await createUserDocument(user);
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

// Create new user document
async function createUserDocument(user) {
    try {
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'New Player',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            role: 'user',
            stats: {
                tournamentsJoined: 0,
                wins: 0,
                points: 0
            },
            gameIds: {
                freefire: '',
                bgmi: ''
            },
            profile: {
                phone: '',
                country: ''
            }
        };
        
        await collections.users.doc(user.uid).set(userData);
        updateUserUI(userData);
    } catch (error) {
        console.error('Error creating user document:', error);
    }
}

// Update user UI
function updateUserUI(userData) {
    const userNameElements = document.querySelectorAll('#userName, #profileName');
    const userEmailElements = document.querySelectorAll('#userEmail, #profileEmail');
    
    userNameElements.forEach(el => {
        if (el) el.textContent = userData.displayName || 'User';
    });
    
    userEmailElements.forEach(el => {
        if (el) el.textContent = userData.email || '';
    });
    
    // Update stats if on user panel
    if (userData.stats) {
        const totalTournaments = document.getElementById('totalTournaments');
        const totalWins = document.getElementById('totalWins');
        const totalPoints = document.getElementById('totalPoints');
        const winRate = document.getElementById('winRate');
        
        if (totalTournaments) totalTournaments.textContent = userData.stats.tournamentsJoined || 0;
        if (totalWins) totalWins.textContent = userData.stats.wins || 0;
        if (totalPoints) totalPoints.textContent = userData.stats.points || 0;
        if (winRate) {
            const rate = userData.stats.tournamentsJoined > 0 
                ? Math.round((userData.stats.wins / userData.stats.tournamentsJoined) * 100) 
                : 0;
            winRate.textContent = rate + '%';
        }
    }
}

// Load admin data
async function loadAdminData() {
    try {
        const adminNameEl = document.getElementById('adminName');
        const user = auth.currentUser;
        if (adminNameEl && user) {
            adminNameEl.textContent = user.displayName || 'Admin';
        }
        
        // Load admin dashboard stats
        loadAdminStats();
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Load admin dashboard stats
async function loadAdminStats() {
    try {
        // Get total tournaments
        const tournamentsSnapshot = await collections.tournaments.get();
        const totalTournamentsEl = document.getElementById('totalTournaments');
        if (totalTournamentsEl) {
            totalTournamentsEl.textContent = tournamentsSnapshot.size;
        }
        
        // Get total users
        const usersSnapshot = await collections.users.where('role', '==', 'user').get();
        const totalUsersEl = document.getElementById('totalUsers');
        if (totalUsersEl) {
            totalUsersEl.textContent = usersSnapshot.size;
        }
        
        // Get active tournaments
        const activeTournamentsSnapshot = await collections.tournaments
            .where('status', 'in', ['open', 'ongoing']).get();
        const activeTournamentsEl = document.getElementById('activeTournaments');
        if (activeTournamentsEl) {
            activeTournamentsEl.textContent = activeTournamentsSnapshot.size;
        }
        
        // Calculate total revenue (placeholder)
        const totalRevenueEl = document.getElementById('totalRevenue');
        if (totalRevenueEl) {
            totalRevenueEl.textContent = '$0'; // Implement revenue calculation
        }
    } catch (error) {
        console.error('Error loading admin stats:', error);
    }
}

// Authentication functions
async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

async function signUp(email, password, displayName) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Update user profile
        await user.updateProfile({
            displayName: displayName
        });
        
        return user;
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

async function signOut() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Tournament functions
async function createTournament(tournamentData) {
    try {
        const tournament = {
            ...tournamentData,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: auth.currentUser.uid,
            status: 'open',
            participants: [],
            participantCount: 0
        };
        
        const docRef = await collections.tournaments.add(tournament);
        console.log('Tournament created with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Error creating tournament:', error);
        throw error;
    }
}

async function joinTournament(tournamentId, teamData) {
    try {
        const user = auth.currentUser;
        if (!user) throw new Error('User not authenticated');
        
        const participantData = {
            tournamentId: tournamentId,
            userId: user.uid,
            userEmail: user.email,
            teamName: teamData.teamName,
            gameId: teamData.gameId,
            joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'registered'
        };
        
        // Add participant
        await collections.participants.add(participantData);
        
        // Update tournament participant count
        await collections.tournaments.doc(tournamentId).update({
            participantCount: firebase.firestore.FieldValue.increment(1)
        });
        
        // Update user stats
        await collections.users.doc(user.uid).update({
            'stats.tournamentsJoined': firebase.firestore.FieldValue.increment(1)
        });
        
        console.log('Successfully joined tournament');
        return true;
    } catch (error) {
        console.error('Error joining tournament:', error);
        throw error;
    }
}

async function getTournaments(filters = {}) {
    try {
        let query = collections.tournaments;
        
        if (filters.status && filters.status !== 'all') {
            query = query.where('status', '==', filters.status);
        }
        
        if (filters.game && filters.game !== 'all') {
            query = query.where('gameType', '==', filters.game);
        }
        
        query = query.orderBy('createdAt', 'desc');
        
        const snapshot = await query.get();
        const tournaments = [];
        
        snapshot.forEach(doc => {
            tournaments.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        return tournaments;
    } catch (error) {
        console.error('Error getting tournaments:', error);
        throw error;
    }
}

async function getUserTournaments(userId) {
    try {
        const participantsSnapshot = await collections.participants
            .where('userId', '==', userId)
            .get();
        
        const tournaments = [];
        
        for (const doc of participantsSnapshot.docs) {
            const participantData = doc.data();
            const tournamentDoc = await collections.tournaments.doc(participantData.tournamentId).get();
            
            if (tournamentDoc.exists) {
                tournaments.push({
                    id: tournamentDoc.id,
                    ...tournamentDoc.data(),
                    participantData: participantData
                });
            }
        }
        
        return tournaments;
    } catch (error) {
        console.error('Error getting user tournaments:', error);
        throw error;
    }
}

// Utility functions
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else {
        date = new Date(timestamp);
    }
    
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function generateTournamentCode() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// Error handling
function handleError(error, customMessage = '') {
    console.error('Error:', error);
    
    let message = customMessage;
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
                message = 'User not found. Please check your email.';
                break;
            case 'auth/wrong-password':
                message = 'Incorrect password. Please try again.';
                break;
            case 'auth/email-already-in-use':
                message = 'Email is already registered. Please use a different email.';
                break;
            case 'auth/weak-password':
                message = 'Password is too weak. Please use a stronger password.';
                break;
            case 'auth/invalid-email':
                message = 'Invalid email address. Please enter a valid email.';
                break;
            default:
                message = error.message || 'An error occurred. Please try again.';
        }
    }
    
    showMessage(message, 'error');
}

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

// Export functions for use in other scripts
window.firebaseUtils = {
    auth,
    db,
    collections,
    signIn,
    signUp,
    signOut,
    createTournament,
    joinTournament,
    getTournaments,
    getUserTournaments,
    formatDate,
    formatCurrency,
    generateTournamentCode,
    handleError,
    showMessage
};