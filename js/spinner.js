import { db } from './firebase-config.js';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { showToast, showLoader, hideLoader, canPerformAction } from './utils.js';
import authManager from './auth.js';

class SpinnerManager {
  constructor() {
    this.userData = null;
    this.spinRewards = [10, 25, 50, 75, 100, 150, 200, 500];
    this.isSpinning = false;
    this.initializeSpinner();
  }

  initializeSpinner() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.updateSpinButton();
    });

    // Bind spin button
    document.getElementById('spin-btn').addEventListener('click', () => {
      this.spin();
    });
  }

  async spin() {
    if (!authManager.currentUser) {
      showToast('Please login first', 'error');
      return;
    }

    if (this.isSpinning) {
      return;
    }

    try {
      // Check if user can spin (24-hour cooldown)
      if (this.userData.tasks.spin && !canPerformAction(this.userData.tasks.spin, 24)) {
        const nextSpin = new Date(this.userData.tasks.spin.toDate().getTime() + 24 * 60 * 60 * 1000);
        showToast(`You can spin again at ${nextSpin.toLocaleString()}`, 'warning');
        return;
      }

      this.isSpinning = true;
      showLoader();

      // Disable spin button
      const spinBtn = document.getElementById('spin-btn');
      spinBtn.disabled = true;
      spinBtn.textContent = 'Spinning...';

      // Random reward
      const rewardIndex = Math.floor(Math.random() * this.spinRewards.length);
      const coinsWon = this.spinRewards[rewardIndex];

      // Calculate rotation (each segment is 45 degrees)
      const segmentAngle = 360 / this.spinRewards.length;
      const targetAngle = (rewardIndex * segmentAngle) + (segmentAngle / 2);
      const totalRotation = 1800 + targetAngle; // 5 full rotations + target

      // Animate spinner
      const spinner = document.getElementById('spinner-wheel');
      spinner.style.transform = `rotate(${totalRotation}deg)`;

      // Wait for animation to complete
      setTimeout(async () => {
        try {
          // Add coins to user
          await this.addCoins(coinsWon);
          await this.updateSpinTimestamp();

          showToast(`Congratulations! You won ${coinsWon} coins!`, 'success');
          
          // Reset button
          spinBtn.disabled = false;
          spinBtn.textContent = 'Spin Again Tomorrow';
          
          this.updateSpinButton();
          
        } catch (error) {
          showToast(error.message, 'error');
          spinBtn.disabled = false;
          spinBtn.textContent = 'Spin Now!';
        }
        
        this.isSpinning = false;
        hideLoader();
      }, 3000);

    } catch (error) {
      this.isSpinning = false;
      hideLoader();
      showToast(error.message, 'error');
    }
  }

  async addCoins(amount) {
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
      await this.logTransaction(amount, 'Spin & Win');
      
    } catch (error) {
      console.error('Error adding coins:', error);
      throw error;
    }
  }

  async updateSpinTimestamp() {
    try {
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      await updateDoc(userRef, {
        'tasks.spin': serverTimestamp()
      });
      
      // Update local data
      this.userData.tasks.spin = new Date();
      
    } catch (error) {
      console.error('Error updating spin timestamp:', error);
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

  updateSpinButton() {
    if (!this.userData) return;
    
    const spinBtn = document.getElementById('spin-btn');
    const cooldownEl = document.getElementById('spin-cooldown');
    
    if (this.userData.tasks.spin && !canPerformAction(this.userData.tasks.spin, 24)) {
      spinBtn.disabled = true;
      spinBtn.textContent = 'Already Spun Today';
      
      const nextSpin = new Date(this.userData.tasks.spin.toDate().getTime() + 24 * 60 * 60 * 1000);
      cooldownEl.textContent = `Next spin available: ${nextSpin.toLocaleString()}`;
    } else {
      spinBtn.disabled = false;
      spinBtn.textContent = 'Spin Now!';
      cooldownEl.textContent = 'Free spin available!';
    }
  }
}

// Initialize spinner manager
const spinnerManager = new SpinnerManager();

export default spinnerManager;