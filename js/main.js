// Main JavaScript for landing page
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the landing page
    initializeLandingPage();
    
    // Load active tournaments preview
    loadActiveTournaments();
    
    // Set up smooth scrolling for navigation links
    setupSmoothScrolling();
    
    // Set up intersection observer for animations
    setupScrollAnimations();
});

// Initialize landing page
function initializeLandingPage() {
    console.log('Tournament Hub Landing Page Initialized');
    
    // Check if user is already logged in
    if (window.firebaseUtils && window.firebaseUtils.auth) {
        window.firebaseUtils.auth.onAuthStateChanged((user) => {
            if (user) {
                // User is signed in, you could show different content
                console.log('User is signed in:', user.email);
            }
        });
    }
}

// Load active tournaments for preview
async function loadActiveTournaments() {
    try {
        const tournamentsContainer = document.getElementById('activeTournaments');
        if (!tournamentsContainer) return;
        
        // Show loading state
        tournamentsContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Loading tournaments...</div>';
        
        // Get tournaments from Firebase (if available)
        let tournaments = [];
        if (window.firebaseUtils && window.firebaseUtils.getTournaments) {
            try {
                tournaments = await window.firebaseUtils.getTournaments({ status: 'open' });
                tournaments = tournaments.slice(0, 6); // Limit to 6 tournaments
            } catch (error) {
                console.log('Firebase not available, using mock data');
                tournaments = getMockTournaments();
            }
        } else {
            // Use mock data if Firebase is not available
            tournaments = getMockTournaments();
        }
        
        // Render tournaments
        if (tournaments.length > 0) {
            renderTournaments(tournaments, tournamentsContainer);
        } else {
            tournamentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-trophy"></i>
                    <h3>No Active Tournaments</h3>
                    <p>New tournaments will appear here soon!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading active tournaments:', error);
        const tournamentsContainer = document.getElementById('activeTournaments');
        if (tournamentsContainer) {
            tournamentsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Tournaments</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }
}

// Get mock tournaments for demo
function getMockTournaments() {
    return [
        {
            id: 'mock1',
            tournamentName: 'Free Fire Championship',
            gameType: 'freefire',
            status: 'open',
            maxParticipants: 100,
            participantCount: 45,
            entryFee: 10,
            firstPrize: 500,
            startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            description: 'Join the ultimate Free Fire championship and compete for amazing prizes!'
        },
        {
            id: 'mock2',
            tournamentName: 'BGMI Battle Royale',
            gameType: 'bgmi',
            status: 'open',
            maxParticipants: 80,
            participantCount: 32,
            entryFee: 15,
            firstPrize: 750,
            startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            description: 'Epic BGMI tournament with squad battles and intense competition!'
        },
        {
            id: 'mock3',
            tournamentName: 'Free Fire Squad Wars',
            gameType: 'freefire',
            status: 'open',
            maxParticipants: 64,
            participantCount: 28,
            entryFee: 8,
            firstPrize: 400,
            startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
            description: 'Team up with your squad and dominate the battlefield!'
        },
        {
            id: 'mock4',
            tournamentName: 'BGMI Pro League',
            gameType: 'bgmi',
            status: 'open',
            maxParticipants: 120,
            participantCount: 67,
            entryFee: 20,
            firstPrize: 1000,
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
            description: 'Professional level BGMI tournament for serious competitors!'
        },
        {
            id: 'mock5',
            tournamentName: 'Free Fire Blitz',
            gameType: 'freefire',
            status: 'open',
            maxParticipants: 50,
            participantCount: 23,
            entryFee: 5,
            firstPrize: 200,
            startDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
            description: 'Quick and intense Free Fire matches for fast-paced action!'
        },
        {
            id: 'mock6',
            tournamentName: 'BGMI Survival Cup',
            gameType: 'bgmi',
            status: 'open',
            maxParticipants: 90,
            participantCount: 41,
            entryFee: 12,
            firstPrize: 600,
            startDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
            description: 'Test your survival skills in this challenging BGMI tournament!'
        }
    ];
}

// Render tournaments
function renderTournaments(tournaments, container) {
    const tournamentsHTML = tournaments.map(tournament => {
        const startDate = tournament.startDate instanceof Date 
            ? tournament.startDate 
            : new Date(tournament.startDate);
        
        const gameIcon = tournament.gameType === 'freefire' 
            ? '<i class="fas fa-fire"></i>' 
            : '<i class="fas fa-crosshairs"></i>';
        
        const gameColor = tournament.gameType === 'freefire' 
            ? 'background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);'
            : 'background: linear-gradient(135deg, #4834d4 0%, #686de0 100%);';
        
        return `
            <div class="tournament-card" data-tournament-id="${tournament.id}">
                <div class="tournament-header">
                    <h3 class="tournament-title">${tournament.tournamentName}</h3>
                    <div class="tournament-game" style="${gameColor}">
                        ${gameIcon} ${tournament.gameType.toUpperCase()}
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
                        <span>First Prize:</span>
                        <span>$${tournament.firstPrize}</span>
                    </div>
                    <div class="tournament-detail">
                        <span>Start Date:</span>
                        <span>${startDate.toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="tournament-status ${tournament.status}">
                    ${tournament.status.toUpperCase()}
                </div>
                <p class="tournament-description">${tournament.description}</p>
                <div class="tournament-actions">
                    <a href="user-panel.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Join Tournament
                    </a>
                    <button class="btn btn-secondary" onclick="viewTournamentDetails('${tournament.id}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = tournamentsHTML;
}

// View tournament details
function viewTournamentDetails(tournamentId) {
    // For now, redirect to user panel
    // In a real app, you might show a modal with details
    window.location.href = `user-panel.html?tournament=${tournamentId}`;
}

// Setup smooth scrolling for navigation links
function setupSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Setup scroll animations
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.feature-card, .tournament-card, .game-card');
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// Handle mobile menu toggle (if needed)
function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    nav.classList.toggle('active');
}

// Handle newsletter signup (placeholder)
function handleNewsletterSignup(email) {
    console.log('Newsletter signup:', email);
    // Implement newsletter signup logic
    alert('Thank you for signing up for our newsletter!');
}

// Handle contact form submission (placeholder)
function handleContactForm(formData) {
    console.log('Contact form submission:', formData);
    // Implement contact form logic
    alert('Thank you for your message! We will get back to you soon.');
}

// Utility functions
function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions for global use
window.landingPage = {
    viewTournamentDetails,
    toggleMobileMenu,
    handleNewsletterSignup,
    handleContactForm
};