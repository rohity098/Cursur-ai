import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { showToast, showLoader, hideLoader, formatDate, formatCoins } from './utils.js';
import authManager from './auth.js';

class WithdrawManager {
  constructor() {
    this.userData = null;
    this.selectedMethod = null;
    this.withdrawalHistory = [];
    this.initializeWithdraw();
  }

  initializeWithdraw() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.loadWithdrawalHistory();
    });

    // Bind withdrawal method selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const method = e.currentTarget.dataset.method;
        this.selectWithdrawalMethod(method);
      });
    });

    // Bind withdrawal form
    document.getElementById('withdraw-btn').addEventListener('click', () => {
      this.processWithdrawal();
    });

    // Load withdrawal history when withdraw section is shown
    document.querySelector('[data-section="withdraw"]').addEventListener('click', () => {
      this.loadWithdrawalHistory();
    });
  }

  selectWithdrawalMethod(method) {
    // Remove previous selection
    document.querySelectorAll('.method-card').forEach(card => {
      card.classList.remove('selected');
    });

    // Select new method
    document.querySelector(`[data-method="${method}"]`).classList.add('selected');
    this.selectedMethod = method;

    // Update placeholder text
    const detailsInput = document.getElementById('withdraw-details');
    switch (method) {
      case 'google-play':
        detailsInput.placeholder = 'Enter your Google Play email';
        break;
      case 'phonepe':
        detailsInput.placeholder = 'Enter your PhonePe UPI ID';
        break;
      case 'gpay':
        detailsInput.placeholder = 'Enter your Google Pay UPI ID';
        break;
    }
  }

  async processWithdrawal() {
    if (!authManager.currentUser) {
      showToast('Please login first', 'error');
      return;
    }

    try {
      const amount = parseInt(document.getElementById('withdraw-amount').value);
      const details = document.getElementById('withdraw-details').value.trim();

      // Validation
      if (!this.selectedMethod) {
        showToast('Please select a withdrawal method', 'error');
        return;
      }

      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount', 'error');
        return;
      }

      if (!details) {
        showToast('Please enter payment details', 'error');
        return;
      }

      // Check minimum withdrawal amounts
      const minimums = {
        'google-play': 1000,
        'phonepe': 500,
        'gpay': 500
      };

      if (amount < minimums[this.selectedMethod]) {
        showToast(`Minimum withdrawal for ${this.selectedMethod} is ${minimums[this.selectedMethod]} coins`, 'error');
        return;
      }

      // Check if user has enough coins
      const userCoins = this.userData.coins || 0;
      if (amount > userCoins) {
        showToast('Insufficient coins for withdrawal', 'error');
        return;
      }

      showLoader();

      // Create withdrawal request
      const withdrawalRequest = {
        userId: authManager.currentUser.uid,
        amount: amount,
        method: this.selectedMethod,
        paymentDetails: details,
        status: 'pending',
        requestDate: serverTimestamp(),
        processedDate: null,
        processedBy: null,
        notes: ''
      };

      // Add to withdrawals collection
      const withdrawalsRef = collection(db, 'withdrawals');
      await addDoc(withdrawalsRef, withdrawalRequest);

      // Deduct coins from user (will be refunded if rejected)
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      await updateDoc(userRef, {
        coins: userCoins - amount
      });

      // Log transaction
      await this.logTransaction(-amount, `Withdrawal Request: ${this.selectedMethod}`);

      // Update local data
      this.userData.coins = userCoins - amount;
      document.getElementById('coin-count').textContent = this.userData.coins;

      // Clear form
      document.getElementById('withdraw-amount').value = '';
      document.getElementById('withdraw-details').value = '';
      document.querySelectorAll('.method-card').forEach(card => {
        card.classList.remove('selected');
      });
      this.selectedMethod = null;

      showToast('Withdrawal request submitted successfully!', 'success');
      
      // Refresh withdrawal history
      this.loadWithdrawalHistory();

      hideLoader();

    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
    }
  }

  async loadWithdrawalHistory() {
    if (!authManager.currentUser) return;

    try {
      const withdrawalsRef = collection(db, 'withdrawals');
      const q = query(
        withdrawalsRef,
        where('userId', '==', authManager.currentUser.uid),
        orderBy('requestDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      this.withdrawalHistory = [];

      querySnapshot.forEach((doc) => {
        this.withdrawalHistory.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.displayWithdrawalHistory();

    } catch (error) {
      console.error('Error loading withdrawal history:', error);
      this.displayEmptyWithdrawalHistory();
    }
  }

  displayWithdrawalHistory() {
    const container = document.getElementById('withdrawal-history');

    if (this.withdrawalHistory.length === 0) {
      this.displayEmptyWithdrawalHistory();
      return;
    }

    container.innerHTML = `
      <div class="table-container">
        <table class="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${this.withdrawalHistory.map(withdrawal => `
              <tr>
                <td>${formatDate(withdrawal.requestDate.toDate())}</td>
                <td>${formatCoins(withdrawal.amount)} coins</td>
                <td>${this.formatMethod(withdrawal.method)}</td>
                <td><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></td>
                <td>${withdrawal.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  displayEmptyWithdrawalHistory() {
    const container = document.getElementById('withdrawal-history');
    container.innerHTML = `
      <div class="text-center" style="padding: 2rem;">
        <i class="fas fa-money-bill-wave" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h3>No Withdrawal History</h3>
        <p>Your withdrawal requests will appear here</p>
      </div>
    `;
  }

  formatMethod(method) {
    const methods = {
      'google-play': 'Google Play',
      'phonepe': 'PhonePe',
      'gpay': 'Google Pay'
    };
    return methods[method] || method;
  }

  async logTransaction(amount, source) {
    try {
      const transactionRef = collection(db, 'transactions');
      await addDoc(transactionRef, {
        userId: authManager.currentUser.uid,
        amount: amount,
        type: amount > 0 ? 'earn' : 'spend',
        source: source,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging transaction:', error);
    }
  }

  getWithdrawalStats() {
    if (!this.withdrawalHistory.length) return null;

    const totalRequested = this.withdrawalHistory.reduce((sum, w) => sum + w.amount, 0);
    const approvedWithdrawals = this.withdrawalHistory.filter(w => w.status === 'approved');
    const totalApproved = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const pendingWithdrawals = this.withdrawalHistory.filter(w => w.status === 'pending');
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);

    return {
      totalRequested,
      totalApproved,
      totalPending,
      requestCount: this.withdrawalHistory.length,
      approvedCount: approvedWithdrawals.length,
      pendingCount: pendingWithdrawals.length
    };
  }
}

// Initialize withdraw manager
const withdrawManager = new WithdrawManager();

export default withdrawManager;