import { formatCoins } from './utils.js';
import authManager from './auth.js';

class DashboardManager {
  constructor() {
    this.userData = null;
    this.initializeDashboard();
  }

  initializeDashboard() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.updateDashboard();
    });

    // Update dashboard when dashboard section is shown
    document.querySelector('[data-section="dashboard"]').addEventListener('click', () => {
      this.updateDashboard();
    });
  }

  updateDashboard() {
    if (!this.userData) return;

    this.updateEarningsCards();
    this.updateQuickActions();
    this.showWelcomeMessage();
  }

  updateEarningsCards() {
    // Today's earnings calculation
    const todayEarnings = this.calculateTodayEarnings();
    document.getElementById('today-earnings').textContent = `${formatCoins(todayEarnings)} Coins`;

    // Total earnings
    const totalEarnings = this.userData.totalEarned || 0;
    document.getElementById('total-earnings').textContent = `${formatCoins(totalEarnings)} Coins`;

    // Referral count
    const referralCount = this.userData.referrals || 0;
    document.getElementById('referral-count').textContent = `${referralCount} Friends`;
  }

  updateQuickActions() {
    // Update daily login button
    const dailyLoginBtn = document.getElementById('daily-login-btn');
    if (this.userData.tasks && this.userData.tasks.dailyLogin) {
      const lastLogin = this.userData.tasks.dailyLogin.toDate();
      const today = new Date();
      const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (daysDiff < 1) {
        dailyLoginBtn.textContent = 'Already Claimed';
        dailyLoginBtn.disabled = true;
        dailyLoginBtn.classList.add('disabled');
      } else {
        dailyLoginBtn.textContent = 'Claim Reward';
        dailyLoginBtn.disabled = false;
        dailyLoginBtn.classList.remove('disabled');
      }
    } else {
      dailyLoginBtn.textContent = 'Claim Reward';
      dailyLoginBtn.disabled = false;
      dailyLoginBtn.classList.remove('disabled');
    }

    // Update watch & earn button
    const watchEarnBtn = document.getElementById('watch-earn-btn');
    if (this.userData.tasks && this.userData.tasks.watchAd) {
      const lastWatch = this.userData.tasks.watchAd.toDate();
      const now = new Date();
      const timeDiff = now - lastWatch;
      const minutesDiff = Math.floor(timeDiff / (1000 * 60));
      
      if (minutesDiff < 5) {
        const remainingTime = 5 - minutesDiff;
        watchEarnBtn.textContent = `Wait ${remainingTime}m`;
        watchEarnBtn.disabled = true;
        watchEarnBtn.classList.add('disabled');
      } else {
        watchEarnBtn.textContent = 'Watch Now';
        watchEarnBtn.disabled = false;
        watchEarnBtn.classList.remove('disabled');
      }
    } else {
      watchEarnBtn.textContent = 'Watch Now';
      watchEarnBtn.disabled = false;
      watchEarnBtn.classList.remove('disabled');
    }
  }

  showWelcomeMessage() {
    const loginStreak = this.userData.loginStreak || 1;
    const userName = this.userData.email ? this.userData.email.split('@')[0] : 'Player';
    
    if (loginStreak > 1) {
      // Show streak message
      const streakMessage = `Welcome back, ${userName}! You're on a ${loginStreak} day streak! 🔥`;
      this.showStreakNotification(streakMessage);
    }
  }

  showStreakNotification(message) {
    // Create streak notification
    const notification = document.createElement('div');
    notification.className = 'streak-notification';
    notification.innerHTML = `
      <div class="streak-content">
        <i class="fas fa-fire"></i>
        <span>${message}</span>
        <button class="close-streak">&times;</button>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(255, 107, 107, 0.3);
      z-index: 2000;
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
    
    // Manual close
    notification.querySelector('.close-streak').addEventListener('click', () => {
      notification.remove();
    });
  }

  calculateTodayEarnings() {
    // Simple calculation for demonstration
    // In a real app, this would track actual daily transactions
    const loginStreak = this.userData.loginStreak || 1;
    let todayEarnings = 0;
    
    // Base daily login reward
    if (loginStreak >= 7) todayEarnings += 200;
    else if (loginStreak >= 3) todayEarnings += 100;
    else if (loginStreak >= 2) todayEarnings += 75;
    else todayEarnings += 50;
    
    // Add some variation based on user activity
    const activityBonus = Math.floor(Math.random() * 100);
    todayEarnings += activityBonus;
    
    return todayEarnings;
  }

  getDashboardStats() {
    if (!this.userData) return null;
    
    return {
      totalCoins: this.userData.coins || 0,
      totalEarned: this.userData.totalEarned || 0,
      totalWithdrawn: this.userData.totalWithdrawn || 0,
      referrals: this.userData.referrals || 0,
      loginStreak: this.userData.loginStreak || 1,
      todayEarnings: this.calculateTodayEarnings()
    };
  }

  // Method to refresh dashboard data
  async refreshDashboard() {
    if (authManager.currentUser) {
      await authManager.loadUserData();
    }
  }
}

// Add CSS for streak notification animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  .streak-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .streak-content i {
    font-size: 1.2rem;
    animation: bounce 2s infinite;
  }
  
  .close-streak {
    background: none;
    border: none;
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    margin-left: auto;
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;
document.head.appendChild(style);

// Initialize dashboard manager
const dashboardManager = new DashboardManager();

export default dashboardManager;