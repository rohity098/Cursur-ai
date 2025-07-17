// Authentication state management
let currentUser = null;
let userData = null;

// DOM elements
const loadingScreen = document.getElementById('loading');
const loginScreen = document.getElementById('loginScreen');
const mainApp = document.getElementById('mainApp');
const googleSignInBtn = document.getElementById('googleSignIn');
const logoutBtn = document.getElementById('logoutBtn');

// Initialize authentication
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
        currentUser = user;
        
        // Get or create user data
        userData = await dbHelpers.getUserData(user.uid);
        
        if (!userData) {
            // Create new user
            const newUserData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                playerId: user.uid.substring(0, 8),
                referralId: user.uid.substring(0, 6),
                lastLogin: firebase.database.ServerValue.TIMESTAMP
            };
            
            // Check for referral
            const referralId = getReferralIdFromUrl();
            if (referralId) {
                newUserData.referredBy = referralId;
            }
            
            const created = await dbHelpers.createUser(user.uid, newUserData);
            if (created) {
                userData = await dbHelpers.getUserData(user.uid);
                
                // Process referral if exists
                if (referralId) {
                    await processReferral(referralId, user.uid, newUserData);
                }
                
                showNotification('Welcome to GameLoot!', 'success');
            } else {
                showNotification('Error creating account', 'error');
                return;
            }
        } else {
            // Update last login
            await database.ref(`users/${user.uid}/lastLogin`).set(firebase.database.ServerValue.TIMESTAMP);
        }
        
        // Show main app
        showMainApp();
    } else {
        currentUser = null;
        userData = null;
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
        console.error('Sign-in error:', error);
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
            <span>Continue with Google</span>
        `;
    }
}

// Sign out
async function signOut() {
    try {
        await auth.signOut();
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Sign-out error:', error);
        showNotification('Sign-out failed', 'error');
    }
}

// Show login screen
function showLoginScreen() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.remove('hidden');
    mainApp.classList.add('hidden');
}

// Show main app
function showMainApp() {
    loadingScreen.classList.add('hidden');
    loginScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    
    // Update UI with user data
    updateUserInterface();
}

// Update user interface with user data
function updateUserInterface() {
    if (!currentUser || !userData) return;
    
    // Update user profile in sidebar
    document.getElementById('userAvatar').src = currentUser.photoURL || '/api/placeholder/48/48';
    document.getElementById('userName').textContent = currentUser.displayName || 'User';
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('playerId').textContent = userData.playerId;
    document.getElementById('referralId').textContent = userData.referralId;
    document.getElementById('userCoins').textContent = userData.coins || 0;
    
    // Update header coins
    document.getElementById('headerCoins').textContent = userData.coins || 0;
    
    // Update welcome message
    document.getElementById('welcomeName').textContent = currentUser.displayName?.split(' ')[0] || 'User';
    
    // Update stats
    document.getElementById('totalEarnings').textContent = userData.coins || 0;
    document.getElementById('totalReferrals').textContent = userData.referralCount || 0;
    document.getElementById('tournamentsWon').textContent = userData.tournamentsWon || 0;
    
    // Update referral page
    document.getElementById('referralCode').textContent = userData.referralId;
    document.getElementById('referralEarnings').textContent = userData.referralEarnings || 0;
    document.getElementById('referralCount').textContent = userData.referralCount || 0;
    
    // Generate referral link
    const referralLink = `${window.location.origin}?ref=${userData.referralId}`;
    document.getElementById('referralLink').value = referralLink;
    
    // Update withdraw page
    document.getElementById('availableCoins').textContent = userData.coins || 0;
}

// Process referral
async function processReferral(referralId, newUserUid, newUserData) {
    try {
        // Find user with this referral ID
        const usersSnapshot = await database.ref('users').orderByChild('referralId').equalTo(referralId).once('value');
        const users = usersSnapshot.val();
        
        if (users) {
            const referrerId = Object.keys(users)[0];
            if (referrerId && referrerId !== newUserUid) {
                // Create referral record
                await dbHelpers.createReferral(referrerId, newUserUid, newUserData);
                showNotification('Referral bonus applied!', 'success');
            }
        }
    } catch (error) {
        console.error('Error processing referral:', error);
    }
}

// Listen for real-time updates to user data
function setupRealtimeUpdates() {
    if (!currentUser) return;
    
    database.ref(`users/${currentUser.uid}`).on('value', (snapshot) => {
        const updatedData = snapshot.val();
        if (updatedData) {
            userData = updatedData;
            updateUserInterface();
        }
    });
}

// Call this after successful authentication
auth.onAuthStateChanged((user) => {
    if (user) {
        setupRealtimeUpdates();
    } else {
        // Clean up listeners when user signs out
        database.ref(`users/${currentUser?.uid}`).off();
    }
});

// Export for use in other files
window.currentUser = () => currentUser;
window.userData = () => userData;
window.updateUserInterface = updateUserInterface;