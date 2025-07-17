import { formatDate, formatCoins } from './utils.js';
import authManager from './auth.js';

class ProfileManager {
  constructor() {
    this.userData = null;
    this.initializeProfile();
  }

  initializeProfile() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.updateProfileDisplay();
    });

    // Update profile when profile section is shown
    document.querySelector('[data-section="profile"]').addEventListener('click', () => {
      this.updateProfileDisplay();
    });
  }

  updateProfileDisplay() {
    if (!this.userData || !authManager.currentUser) return;

    // Personal Information
    document.getElementById('player-id').textContent = authManager.currentUser.uid.substring(0, 8).toUpperCase();
    document.getElementById('profile-email').textContent = this.userData.email || 'Not provided';
    document.getElementById('profile-phone').textContent = this.userData.phone || 'Not provided';
    document.getElementById('join-date').textContent = this.userData.joinDate ? 
      formatDate(this.userData.joinDate.toDate()) : 'Unknown';

    // Earnings & Referrals
    document.getElementById('profile-coins').textContent = formatCoins(this.userData.coins || 0);
    document.getElementById('profile-referral-code').textContent = this.userData.referralCode || 'N/A';
    document.getElementById('profile-referrals').textContent = this.userData.referrals || 0;
    document.getElementById('profile-withdrawn').textContent = formatCoins(this.userData.totalWithdrawn || 0);

    // Update dashboard stats
    this.updateDashboardStats();
  }

  updateDashboardStats() {
    if (!this.userData) return;

    // Calculate today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // This would ideally come from a daily earnings tracking system
    // For now, we'll use a simple calculation
    const todayEarnings = this.calculateTodayEarnings();
    
    document.getElementById('today-earnings').textContent = `${formatCoins(todayEarnings)} Coins`;
    document.getElementById('total-earnings').textContent = `${formatCoins(this.userData.totalEarned || 0)} Coins`;
    document.getElementById('referral-count').textContent = `${this.userData.referrals || 0} Friends`;
  }

  calculateTodayEarnings() {
    // Simple calculation based on login streak and current coins
    // In a real app, this would track daily transactions
    const loginStreak = this.userData.loginStreak || 1;
    let todayEarnings = 0;
    
    // Base daily login reward
    if (loginStreak >= 7) todayEarnings += 200;
    else if (loginStreak >= 3) todayEarnings += 100;
    else if (loginStreak >= 2) todayEarnings += 75;
    else todayEarnings += 50;
    
    // Add some random earnings for demonstration
    todayEarnings += Math.floor(Math.random() * 100);
    
    return todayEarnings;
  }

  getProfileSummary() {
    if (!this.userData) return null;
    
    return {
      playerId: authManager.currentUser.uid.substring(0, 8).toUpperCase(),
      email: this.userData.email,
      phone: this.userData.phone,
      coins: this.userData.coins || 0,
      referralCode: this.userData.referralCode,
      referrals: this.userData.referrals || 0,
      totalEarned: this.userData.totalEarned || 0,
      totalWithdrawn: this.userData.totalWithdrawn || 0,
      loginStreak: this.userData.loginStreak || 1,
      joinDate: this.userData.joinDate
    };
  }
}

// Initialize profile manager
const profileManager = new ProfileManager();

export default profileManager;