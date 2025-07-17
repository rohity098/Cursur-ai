// Main app functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Set up navigation
    setupNavigation();
    
    // Set up mobile menu
    setupMobileMenu();
    
    // Set up withdrawal form
    setupWithdrawalForm();
    
    // Set up referral functionality
    setupReferralFunctionality();
    
    // Set up feature cards
    setupFeatureCards();
}

// Navigation setup
function setupNavigation() {
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
            const pageToShow = this.textContent.trim().toLowerCase();
            showPage(pageToShow);
        });
    });
}

// Show specific page
function showPage(pageName) {
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.add('hidden'));
    
    // Show selected page
    let pageId;
    switch(pageName) {
        case 'home':
            pageId = 'homePage';
            break;
        case 'tournaments':
            pageId = 'tournamentsPage';
            break;
        case 'referrals':
            pageId = 'referralPage';
            break;
        case 'withdraw':
            pageId = 'withdrawPage';
            break;
        case 'group chat':
            pageId = 'groupChatPage';
            break;
        default:
            pageId = 'homePage';
    }
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }
}

// Mobile menu setup
function setupMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            sidebar.classList.toggle('-translate-x-full');
            mobileMenuOverlay.classList.toggle('hidden');
        });
    }
    
    if (mobileMenuOverlay) {
        mobileMenuOverlay.addEventListener('click', function() {
            sidebar.classList.add('-translate-x-full');
            mobileMenuOverlay.classList.add('hidden');
        });
    }
}

// Withdrawal form setup
function setupWithdrawalForm() {
    const withdrawForm = document.getElementById('withdrawForm');
    const withdrawMethod = document.getElementById('withdrawMethod');
    const withdrawInputLabel = document.getElementById('withdrawInputLabel');
    const withdrawDetails = document.getElementById('withdrawDetails');
    
    // Update input label based on selected method
    if (withdrawMethod) {
        withdrawMethod.addEventListener('change', function() {
            const method = this.value;
            switch(method) {
                case 'gpay':
                case 'phonepe':
                    withdrawInputLabel.textContent = 'UPI ID';
                    withdrawDetails.placeholder = 'Enter UPI ID (e.g., user@paytm)';
                    break;
                case 'playstore':
                    withdrawInputLabel.textContent = 'Email';
                    withdrawDetails.placeholder = 'Enter email address';
                    break;
                default:
                    withdrawInputLabel.textContent = 'UPI ID / Email';
                    withdrawDetails.placeholder = 'Enter UPI ID or Email';
            }
        });
    }
    
    // Handle form submission
    if (withdrawForm) {
        withdrawForm.addEventListener('submit', handleWithdrawalSubmission);
    }
}

// Handle withdrawal form submission
async function handleWithdrawalSubmission(e) {
    e.preventDefault();
    
    const user = window.currentUser();
    const data = window.userData();
    
    if (!user || !data) {
        showNotification('Please log in to make a withdrawal', 'error');
        return;
    }
    
    const amount = parseInt(document.getElementById('withdrawAmount').value);
    const method = document.getElementById('withdrawMethod').value;
    const details = document.getElementById('withdrawDetails').value;
    
    // Validation
    if (!amount || amount < 100) {
        showNotification('Minimum withdrawal amount is 100 coins', 'error');
        return;
    }
    
    if (amount > (data.coins || 0)) {
        showNotification('Insufficient coins', 'error');
        return;
    }
    
    if (!method) {
        showNotification('Please select a withdrawal method', 'error');
        return;
    }
    
    if (!details) {
        showNotification('Please enter payment details', 'error');
        return;
    }
    
    // Validate email for Play Store
    if (method === 'playstore' && !isValidEmail(details)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate UPI ID for payment methods
    if ((method === 'gpay' || method === 'phonepe') && !isValidUPI(details)) {
        showNotification('Please enter a valid UPI ID', 'error');
        return;
    }
    
    try {
        // Create withdrawal request
        const withdrawalData = {
            amount,
            method,
            details,
            userEmail: user.email,
            userName: user.displayName
        };
        
        const withdrawalId = await dbHelpers.createWithdrawal(user.uid, withdrawalData);
        
        if (withdrawalId) {
            // Deduct coins from user account
            const newCoins = (data.coins || 0) - amount;
            await dbHelpers.updateUserCoins(user.uid, newCoins);
            
            showNotification('Withdrawal request submitted successfully!', 'success');
            
            // Reset form
            document.getElementById('withdrawForm').reset();
            
            // Update UI
            window.updateUserInterface();
        } else {
            showNotification('Failed to submit withdrawal request', 'error');
        }
    } catch (error) {
        console.error('Withdrawal error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    }
}

// Referral functionality setup
function setupReferralFunctionality() {
    const copyReferralCode = document.getElementById('copyReferralCode');
    const copyReferralLink = document.getElementById('copyReferralLink');
    
    if (copyReferralCode) {
        copyReferralCode.addEventListener('click', function() {
            const referralCode = document.getElementById('referralCode').textContent;
            copyToClipboard(referralCode);
        });
    }
    
    if (copyReferralLink) {
        copyReferralLink.addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink').value;
            copyToClipboard(referralLink);
        });
    }
    
    // Load referral history
    loadReferralHistory();
}

// Load referral history
async function loadReferralHistory() {
    const user = window.currentUser();
    if (!user) return;
    
    try {
        const referrals = await dbHelpers.getReferrals(user.uid);
        const referralHistory = document.getElementById('referralHistory');
        
        if (Object.keys(referrals).length === 0) {
            referralHistory.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p>No referrals yet. Start sharing your code!</p>
                </div>
            `;
            return;
        }
        
        referralHistory.innerHTML = '';
        
        Object.entries(referrals).forEach(([id, referral]) => {
            const referralItem = document.createElement('div');
            referralItem.className = 'bg-black/20 rounded-lg p-4 flex items-center justify-between';
            referralItem.innerHTML = `
                <div class="flex items-center space-x-3">
                    <div class="bg-green-500/20 p-2 rounded-full">
                        <i class="fas fa-user-plus text-green-400"></i>
                    </div>
                    <div>
                        <p class="text-white font-semibold">${referral.referredData.displayName}</p>
                        <p class="text-gray-400 text-sm">${referral.referredData.email}</p>
                        <p class="text-gray-400 text-xs">${formatTimestamp(referral.createdAt)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-green-400 font-semibold">+${referral.reward} Coins</p>
                </div>
            `;
            referralHistory.appendChild(referralItem);
        });
    } catch (error) {
        console.error('Error loading referral history:', error);
    }
}

// Feature cards setup
function setupFeatureCards() {
    const featureCards = document.querySelectorAll('.group');
    
    featureCards.forEach(card => {
        card.addEventListener('click', function() {
            const cardTitle = this.querySelector('h3').textContent;
            handleFeatureCardClick(cardTitle);
        });
    });
}

// Handle feature card clicks
function handleFeatureCardClick(feature) {
    switch(feature) {
        case 'Watch & Earn':
            showNotification('Watch & Earn feature coming soon!', 'info');
            break;
        case 'Play Tournament':
            showNotification('Tournament feature coming soon!', 'info');
            break;
        case 'Make Tournament':
            showNotification('Tournament creation coming soon!', 'info');
            break;
        case 'Refer & Earn':
            // Switch to referral page
            document.querySelector('[data-page="referrals"]')?.click();
            break;
        case 'Group Chat':
            showNotification('Group chat feature coming soon!', 'info');
            break;
        case 'Withdraw Coins':
            // Switch to withdraw page
            document.querySelector('.nav-item:nth-child(4)')?.click();
            break;
    }
}

// Utility functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidUPI(upi) {
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+$/;
    return upiRegex.test(upi);
}

// Demo functions for testing (remove in production)
function addDemoCoins() {
    const user = window.currentUser();
    const data = window.userData();
    
    if (user && data) {
        const newCoins = (data.coins || 0) + 100;
        dbHelpers.updateUserCoins(user.uid, newCoins);
        showNotification('Added 100 demo coins!', 'success');
    }
}

// Add demo coins button (for testing - remove in production)
document.addEventListener('DOMContentLoaded', function() {
    // Add demo button to header (for testing only)
    const header = document.querySelector('header .flex');
    if (header) {
        const demoBtn = document.createElement('button');
        demoBtn.className = 'bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-1 rounded-full text-sm transition-colors';
        demoBtn.textContent = 'Add Demo Coins';
        demoBtn.onclick = addDemoCoins;
        header.appendChild(demoBtn);
    }
});

// Load page content when auth state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        // Load referral history when user is authenticated
        setTimeout(() => {
            loadReferralHistory();
        }, 1000);
    }
});