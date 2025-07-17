import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { showToast, showLoader, hideLoader, canPerformAction, formatCoins } from './utils.js';
import authManager from './auth.js';

class EarningManager {
  constructor() {
    this.userData = null;
    this.initializeEarning();
  }

  initializeEarning() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.updateEarningCards();
    });

    // Bind earning buttons
    document.querySelectorAll('.earning-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleEarningAction(action);
      });
    });

    // Dashboard quick actions
    document.getElementById('daily-login-btn')?.addEventListener('click', () => {
      this.handleEarningAction('login');
    });

    document.getElementById('watch-earn-btn')?.addEventListener('click', () => {
      this.handleEarningAction('watch');
    });
  }

  async handleEarningAction(action) {
    if (!authManager.currentUser) {
      showToast('Please login first', 'error');
      return;
    }

    try {
      switch (action) {
        case 'watch':
          await this.watchAndEarn();
          break;
        case 'login':
          await this.dailyLoginReward();
          break;
        case 'play':
          await this.playAndEarn();
          break;
        case 'referral':
          this.showReferralModal();
          break;
        case 'follow':
          this.showFollowModal();
          break;
        case 'join':
          await this.joinAndEarn();
          break;
        default:
          showToast('Unknown action', 'error');
      }
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async watchAndEarn() {
    try {
      showLoader();
      
      // Check if user can watch ads (cooldown: 5 minutes)
      if (this.userData.tasks.watchAd && !canPerformAction(this.userData.tasks.watchAd, 0.083)) {
        const nextTime = new Date(this.userData.tasks.watchAd.toDate().getTime() + 5 * 60 * 1000);
        showToast(`Please wait until ${nextTime.toLocaleTimeString()} to watch another ad`, 'warning');
        hideLoader();
        return;
      }

      // Simulate watching ad
      await this.simulateAdWatch();
      
      // Random coins between 50-100
      const coinsEarned = Math.floor(Math.random() * 51) + 50;
      
      await this.addCoins(coinsEarned, 'Watch & Earn');
      await this.updateTaskTimestamp('watchAd');
      
      showToast(`You earned ${coinsEarned} coins by watching an ad!`, 'success');
      hideLoader();
      
    } catch (error) {
      hideLoader();
      throw error;
    }
  }

  async simulateAdWatch() {
    return new Promise((resolve) => {
      // Simulate 30-second ad
      let countdown = 30;
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Watching Ad...</h3>
          </div>
          <div class="modal-body text-center">
            <div style="width: 100%; height: 200px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;">
              <p>Ad Content Placeholder</p>
            </div>
            <p>Please wait <span id="ad-countdown">${countdown}</span> seconds...</p>
            <button id="close-ad-btn" class="btn btn-primary" style="display: none;">Close Ad & Earn Coins</button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const countdownEl = document.getElementById('ad-countdown');
      const closeBtn = document.getElementById('close-ad-btn');
      
      const timer = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        
        if (countdown <= 0) {
          clearInterval(timer);
          closeBtn.style.display = 'block';
          closeBtn.onclick = () => {
            document.body.removeChild(modal);
            resolve();
          };
        }
      }, 1000);
    });
  }

  async dailyLoginReward() {
    try {
      showLoader();
      
      // Check if user already claimed today
      if (this.userData.tasks.dailyLogin && !canPerformAction(this.userData.tasks.dailyLogin, 24)) {
        showToast('You have already claimed your daily reward today!', 'warning');
        hideLoader();
        return;
      }

      // Calculate reward based on login streak
      const streak = this.userData.loginStreak || 1;
      let coinsEarned = 50; // Base reward
      
      if (streak >= 7) coinsEarned = 200; // Weekly bonus
      else if (streak >= 3) coinsEarned = 100; // 3-day bonus
      else if (streak >= 2) coinsEarned = 75; // 2-day bonus
      
      await this.addCoins(coinsEarned, 'Daily Login');
      await this.updateTaskTimestamp('dailyLogin');
      
      showToast(`Daily reward claimed! ${coinsEarned} coins (${streak} day streak)`, 'success');
      hideLoader();
      
    } catch (error) {
      hideLoader();
      throw error;
    }
  }

  async playAndEarn() {
    try {
      showLoader();
      
      // Simple quiz game
      const questions = [
        {
          question: "What is the capital of France?",
          options: ["London", "Berlin", "Paris", "Madrid"],
          correct: 2
        },
        {
          question: "Which planet is closest to the Sun?",
          options: ["Venus", "Mercury", "Earth", "Mars"],
          correct: 1
        },
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correct: 1
        }
      ];
      
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      const answer = await this.showQuizModal(randomQuestion);
      
      if (answer === randomQuestion.correct) {
        const coinsEarned = 75;
        await this.addCoins(coinsEarned, 'Play & Earn');
        showToast(`Correct! You earned ${coinsEarned} coins`, 'success');
      } else {
        showToast('Wrong answer! Try again later', 'error');
      }
      
      hideLoader();
      
    } catch (error) {
      hideLoader();
      throw error;
    }
  }

  showQuizModal(question) {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Quiz Time!</h3>
          </div>
          <div class="modal-body">
            <p class="mb-3"><strong>${question.question}</strong></p>
            <div class="quiz-options">
              ${question.options.map((option, index) => `
                <button class="btn btn-secondary quiz-option" data-index="${index}" style="width: 100%; margin-bottom: 0.5rem;">
                  ${option}
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      modal.querySelectorAll('.quiz-option').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          document.body.removeChild(modal);
          resolve(index);
        });
      });
    });
  }

  async joinAndEarn() {
    try {
      showLoader();
      
      // Simulate joining an event
      const events = [
        { name: "Welcome Event", coins: 100 },
        { name: "Daily Challenge", coins: 50 },
        { name: "Community Event", coins: 75 }
      ];
      
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      
      await this.addCoins(randomEvent.coins, 'Join & Earn');
      showToast(`Joined ${randomEvent.name}! Earned ${randomEvent.coins} coins`, 'success');
      
      hideLoader();
      
    } catch (error) {
      hideLoader();
      throw error;
    }
  }

  showReferralModal() {
    const modal = document.getElementById('referral-modal');
    const codeDisplay = document.getElementById('referral-code-display');
    
    codeDisplay.value = this.userData.referralCode;
    modal.classList.remove('d-none');
    
    // Copy referral code
    document.getElementById('copy-referral-btn').onclick = () => {
      codeDisplay.select();
      document.execCommand('copy');
      showToast('Referral code copied!', 'success');
    };
    
    // Share referral code
    document.getElementById('share-referral-btn').onclick = () => {
      if (navigator.share) {
        navigator.share({
          title: 'Join GameLoot',
          text: `Join GameLoot with my referral code: ${this.userData.referralCode}`,
          url: window.location.href
        });
      } else {
        // Fallback for browsers without Web Share API
        const shareText = `Join GameLoot with my referral code: ${this.userData.referralCode}\n${window.location.href}`;
        navigator.clipboard.writeText(shareText);
        showToast('Share text copied to clipboard!', 'success');
      }
    };
  }

  showFollowModal() {
    const modal = document.getElementById('follow-modal');
    modal.classList.remove('d-none');
    
    // Handle social media follows
    modal.querySelectorAll('[data-platform]').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        const platform = e.target.dataset.platform;
        
        if (this.userData.tasks.follow[platform]) {
          showToast(`You already followed us on ${platform}!`, 'warning');
          return;
        }
        
        // Simulate following
        await this.followSocialMedia(platform);
      });
    });
  }

  async followSocialMedia(platform) {
    try {
      showLoader();
      
      // Simulate opening social media page
      const socialLinks = {
        youtube: 'https://youtube.com',
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com'
      };
      
      // Open in new tab
      window.open(socialLinks[platform], '_blank');
      
      // After 3 seconds, assume user followed
      setTimeout(async () => {
        await this.addCoins(50, `Follow ${platform}`);
        await this.updateFollowStatus(platform);
        showToast(`Thanks for following us on ${platform}! Earned 50 coins`, 'success');
        hideLoader();
      }, 3000);
      
    } catch (error) {
      hideLoader();
      throw error;
    }
  }

  async addCoins(amount, source) {
    try {
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      const newCoins = (this.userData.coins || 0) + amount;
      const newTotalEarned = (this.userData.totalEarned || 0) + amount;
      
      await updateDoc(userRef, {
        coins: newCoins,
        totalEarned: newTotalEarned
      });
      
      // Update local data
      this.userData.coins = newCoins;
      this.userData.totalEarned = newTotalEarned;
      
      // Update UI
      document.getElementById('coin-count').textContent = newCoins;
      
      // Log transaction
      await this.logTransaction(amount, source);
      
    } catch (error) {
      console.error('Error adding coins:', error);
      throw error;
    }
  }

  async updateTaskTimestamp(taskType) {
    try {
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      await updateDoc(userRef, {
        [`tasks.${taskType}`]: serverTimestamp()
      });
      
      // Update local data
      this.userData.tasks[taskType] = new Date();
      
    } catch (error) {
      console.error('Error updating task timestamp:', error);
      throw error;
    }
  }

  async updateFollowStatus(platform) {
    try {
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      await updateDoc(userRef, {
        [`tasks.follow.${platform}`]: true
      });
      
      // Update local data
      this.userData.tasks.follow[platform] = true;
      
    } catch (error) {
      console.error('Error updating follow status:', error);
      throw error;
    }
  }

  async logTransaction(amount, source) {
    try {
      const transactionRef = doc(db, 'transactions', `${authManager.currentUser.uid}_${Date.now()}`);
      await setDoc(transactionRef, {
        userId: authManager.currentUser.uid,
        amount: amount,
        type: 'earn',
        source: source,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  updateEarningCards() {
    if (!this.userData) return;
    
    // Update daily login card
    const dailyLoginCard = document.getElementById('login-earn-card');
    if (this.userData.tasks.dailyLogin && !canPerformAction(this.userData.tasks.dailyLogin, 24)) {
      dailyLoginCard.classList.add('disabled');
      dailyLoginCard.querySelector('.btn').textContent = 'Already Claimed';
      dailyLoginCard.querySelector('.btn').disabled = true;
    } else {
      dailyLoginCard.classList.remove('disabled');
      dailyLoginCard.querySelector('.btn').textContent = 'Claim Daily Reward';
      dailyLoginCard.querySelector('.btn').disabled = false;
    }
    
    // Update watch & earn card
    const watchCard = document.getElementById('watch-earn-card');
    if (this.userData.tasks.watchAd && !canPerformAction(this.userData.tasks.watchAd, 0.083)) {
      watchCard.classList.add('disabled');
      const nextTime = new Date(this.userData.tasks.watchAd.toDate().getTime() + 5 * 60 * 1000);
      watchCard.querySelector('p').textContent = `Next video available at ${nextTime.toLocaleTimeString()}`;
    } else {
      watchCard.classList.remove('disabled');
      watchCard.querySelector('p').textContent = 'Watch rewarded videos and earn 50-100 coins per video';
    }
    
    // Update follow cards
    const followCard = document.getElementById('follow-earn-card');
    const followedCount = Object.values(this.userData.tasks.follow).filter(Boolean).length;
    if (followedCount >= 3) {
      followCard.classList.add('disabled');
      followCard.querySelector('p').textContent = 'You have followed all our social media pages!';
    }
  }
}

// Global function to close modals
window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('d-none');
};

// Initialize earning manager
const earningManager = new EarningManager();

export default earningManager;