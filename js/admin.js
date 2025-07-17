import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit,
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { showToast, showLoader, hideLoader, formatDate, formatCoins, debounce } from './utils.js';

class AdminManager {
  constructor() {
    this.currentAdmin = null;
    this.currentSection = 'overview';
    this.users = [];
    this.withdrawals = [];
    this.tournaments = [];
    this.stats = {};
    this.initializeAdmin();
  }

  initializeAdmin() {
    // Check auth state
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.checkAdminAccess(user);
      } else {
        this.showAdminAuth();
      }
    });

    this.bindEvents();
  }

  async checkAdminAccess(user) {
    try {
      // Check if user is admin
      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (adminDoc.exists()) {
        this.currentAdmin = user;
        this.showAdminDashboard();
        this.loadDashboardData();
      } else {
        showToast('Access denied. Admin privileges required.', 'error');
        await signOut(auth);
      }
    } catch (error) {
      console.error('Error checking admin access:', error);
      showToast('Error checking admin access', 'error');
    }
  }

  showAdminAuth() {
    document.getElementById('admin-auth-section').classList.remove('d-none');
    document.getElementById('admin-dashboard').classList.add('d-none');
  }

  showAdminDashboard() {
    document.getElementById('admin-auth-section').classList.add('d-none');
    document.getElementById('admin-dashboard').classList.remove('d-none');
  }

  bindEvents() {
    // Admin login
    document.getElementById('admin-login-btn').addEventListener('click', async () => {
      const email = document.getElementById('admin-email').value;
      const password = document.getElementById('admin-password').value;
      
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      
      try {
        showLoader();
        await signInWithEmailAndPassword(auth, email, password);
        hideLoader();
      } catch (error) {
        hideLoader();
        showToast('Invalid admin credentials', 'error');
      }
    });

    // Admin logout
    document.getElementById('admin-logout-btn').addEventListener('click', async () => {
      try {
        await signOut(auth);
        showToast('Logged out successfully', 'info');
      } catch (error) {
        showToast('Error logging out', 'error');
      }
    });

    // Navigation
    document.querySelectorAll('.admin-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;
        this.showSection(section);
      });
    });

    // Search and filters
    document.getElementById('user-search').addEventListener('input', debounce((e) => {
      this.filterUsers(e.target.value);
    }, 300));

    document.getElementById('user-filter').addEventListener('change', (e) => {
      this.filterUsers(document.getElementById('user-search').value, e.target.value);
    });

    document.getElementById('withdrawal-filter').addEventListener('change', (e) => {
      this.filterWithdrawals(e.target.value);
    });

    // Modal bindings
    this.bindModalEvents();
  }

  bindModalEvents() {
    // User edit modal
    document.getElementById('save-user-changes').addEventListener('click', () => {
      this.saveUserChanges();
    });

    // Withdrawal processing
    document.getElementById('process-withdrawal').addEventListener('click', () => {
      this.processWithdrawal();
    });

    // Tournament creation
    document.getElementById('create-tournament-btn').addEventListener('click', () => {
      this.showTournamentModal();
    });

    document.getElementById('create-tournament').addEventListener('click', () => {
      this.createTournament();
    });

    // Task updates
    document.getElementById('update-daily-rewards').addEventListener('click', () => {
      this.updateTaskSettings('dailyRewards');
    });

    document.getElementById('update-watch-rewards').addEventListener('click', () => {
      this.updateTaskSettings('watchRewards');
    });

    document.getElementById('update-spin-rewards').addEventListener('click', () => {
      this.updateTaskSettings('spinRewards');
    });
  }

  showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.admin-nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.admin-section').forEach(section => {
      section.classList.add('d-none');
    });
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');

    this.currentSection = sectionName;

    // Load section-specific data
    switch (sectionName) {
      case 'users':
        this.loadUsers();
        break;
      case 'withdrawals':
        this.loadWithdrawals();
        break;
      case 'tournaments':
        this.loadTournaments();
        break;
      case 'tasks':
        this.loadTaskSettings();
        break;
    }
  }

  async loadDashboardData() {
    try {
      showLoader();
      await Promise.all([
        this.loadStats(),
        this.loadRecentActivity()
      ]);
      hideLoader();
    } catch (error) {
      hideLoader();
      console.error('Error loading dashboard data:', error);
    }
  }

  async loadStats() {
    try {
      // Load users count
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnapshot.size;
      
      // Calculate total coins distributed
      let totalCoinsDistributed = 0;
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        totalCoinsDistributed += userData.totalEarned || 0;
      });

      // Load pending withdrawals
      const pendingWithdrawalsQuery = query(
        collection(db, 'withdrawals'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingWithdrawalsQuery);
      const pendingWithdrawals = pendingSnapshot.size;

      // Load active tournaments
      const activeTournamentsQuery = query(
        collection(db, 'tournaments'),
        where('status', 'in', ['upcoming', 'active'])
      );
      const activeSnapshot = await getDocs(activeTournamentsQuery);
      const activeTournaments = activeSnapshot.size;

      // Update UI
      document.getElementById('total-users').textContent = totalUsers;
      document.getElementById('total-coins-distributed').textContent = formatCoins(totalCoinsDistributed);
      document.getElementById('pending-withdrawals').textContent = pendingWithdrawals;
      document.getElementById('active-tournaments').textContent = activeTournaments;

      this.stats = {
        totalUsers,
        totalCoinsDistributed,
        pendingWithdrawals,
        activeTournaments
      };

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadRecentActivity() {
    try {
      const recentTransactions = query(
        collection(db, 'transactions'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      
      const snapshot = await getDocs(recentTransactions);
      const activities = [];
      
      snapshot.forEach(doc => {
        activities.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.displayRecentActivity(activities);
      
    } catch (error) {
      console.error('Error loading recent activity:', error);
      document.getElementById('recent-activity').innerHTML = '<p>Error loading recent activity</p>';
    }
  }

  displayRecentActivity(activities) {
    const container = document.getElementById('recent-activity');
    
    if (activities.length === 0) {
      container.innerHTML = '<p>No recent activity</p>';
      return;
    }

    container.innerHTML = activities.map(activity => `
      <div class="activity-item" style="padding: 0.5rem 0; border-bottom: 1px solid #eee;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <strong>${activity.source}</strong>
            <span class="text-${activity.type === 'earn' ? 'success' : 'danger'}">
              ${activity.type === 'earn' ? '+' : '-'}${formatCoins(Math.abs(activity.amount))} coins
            </span>
          </div>
          <small class="text-muted">${formatDate(activity.timestamp.toDate())}</small>
        </div>
      </div>
    `).join('');
  }

  async loadUsers() {
    try {
      showLoader();
      const usersSnapshot = await getDocs(collection(db, 'users'));
      this.users = [];
      
      usersSnapshot.forEach(doc => {
        this.users.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.displayUsers(this.users);
      hideLoader();
      
    } catch (error) {
      hideLoader();
      console.error('Error loading users:', error);
    }
  }

  displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    
    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id.substring(0, 8)}</td>
        <td>${user.email || 'N/A'}</td>
        <td>${user.phone || 'N/A'}</td>
        <td>${formatCoins(user.coins || 0)}</td>
        <td>${formatCoins(user.totalEarned || 0)}</td>
        <td>${user.referrals || 0}</td>
        <td>${user.joinDate ? formatDate(user.joinDate.toDate()) : 'N/A'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="adminManager.editUser('${user.id}')">Edit</button>
        </td>
      </tr>
    `).join('');
  }

  filterUsers(searchTerm = '', filter = '') {
    let filteredUsers = this.users;

    // Search filter
    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user => 
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm) ||
        user.id.includes(searchTerm)
      );
    }

    // Category filter
    if (filter) {
      switch (filter) {
        case 'active':
          filteredUsers = filteredUsers.filter(user => 
            user.lastLogin && (Date.now() - user.lastLogin.toDate().getTime()) < 7 * 24 * 60 * 60 * 1000
          );
          break;
        case 'high-earners':
          filteredUsers = filteredUsers.filter(user => (user.totalEarned || 0) > 1000);
          break;
        case 'recent':
          filteredUsers = filteredUsers.filter(user => 
            user.joinDate && (Date.now() - user.joinDate.toDate().getTime()) < 30 * 24 * 60 * 60 * 1000
          );
          break;
      }
    }

    this.displayUsers(filteredUsers);
  }

  async editUser(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;

    // Populate modal
    document.getElementById('edit-user-email').value = user.email || '';
    document.getElementById('edit-user-coins').value = user.coins || 0;
    document.getElementById('edit-user-earned').value = user.totalEarned || 0;
    
    // Store user ID for saving
    document.getElementById('save-user-changes').dataset.userId = userId;
    
    // Show modal
    document.getElementById('user-edit-modal').classList.remove('d-none');
  }

  async saveUserChanges() {
    const userId = document.getElementById('save-user-changes').dataset.userId;
    const action = document.getElementById('user-action').value;
    
    try {
      showLoader();
      const userRef = doc(db, 'users', userId);
      
      switch (action) {
        case 'update':
          await updateDoc(userRef, {
            coins: parseInt(document.getElementById('edit-user-coins').value),
            totalEarned: parseInt(document.getElementById('edit-user-earned').value)
          });
          break;
        case 'add-coins':
          const addAmount = parseInt(document.getElementById('edit-user-coins').value);
          const currentUser = this.users.find(u => u.id === userId);
          await updateDoc(userRef, {
            coins: (currentUser.coins || 0) + addAmount,
            totalEarned: (currentUser.totalEarned || 0) + addAmount
          });
          break;
        case 'deduct-coins':
          const deductAmount = parseInt(document.getElementById('edit-user-coins').value);
          const currentUser2 = this.users.find(u => u.id === userId);
          await updateDoc(userRef, {
            coins: Math.max(0, (currentUser2.coins || 0) - deductAmount)
          });
          break;
        case 'reset-tasks':
          await updateDoc(userRef, {
            'tasks.dailyLogin': null,
            'tasks.watchAd': null,
            'tasks.spin': null
          });
          break;
      }
      
      showToast('User updated successfully', 'success');
      document.getElementById('user-edit-modal').classList.add('d-none');
      this.loadUsers();
      hideLoader();
      
    } catch (error) {
      hideLoader();
      showToast('Error updating user', 'error');
    }
  }

  async loadWithdrawals() {
    try {
      showLoader();
      const withdrawalsSnapshot = await getDocs(
        query(collection(db, 'withdrawals'), orderBy('requestDate', 'desc'))
      );
      
      this.withdrawals = [];
      
      for (const doc of withdrawalsSnapshot.docs) {
        const withdrawalData = doc.data();
        // Get user email
        const userDoc = await getDoc(doc(db, 'users', withdrawalData.userId));
        const userEmail = userDoc.exists() ? userDoc.data().email : 'Unknown';
        
        this.withdrawals.push({
          id: doc.id,
          userEmail,
          ...withdrawalData
        });
      }

      this.displayWithdrawals(this.withdrawals);
      hideLoader();
      
    } catch (error) {
      hideLoader();
      console.error('Error loading withdrawals:', error);
    }
  }

  displayWithdrawals(withdrawals) {
    const tbody = document.getElementById('withdrawals-table-body');
    
    tbody.innerHTML = withdrawals.map(withdrawal => `
      <tr>
        <td>${withdrawal.id.substring(0, 8)}</td>
        <td>${withdrawal.userEmail}</td>
        <td>${formatCoins(withdrawal.amount)}</td>
        <td>${withdrawal.method}</td>
        <td>${withdrawal.paymentDetails}</td>
        <td>${formatDate(withdrawal.requestDate.toDate())}</td>
        <td><span class="status-badge status-${withdrawal.status}">${withdrawal.status}</span></td>
        <td>
          ${withdrawal.status === 'pending' ? 
            `<button class="btn btn-sm btn-primary" onclick="adminManager.processWithdrawalModal('${withdrawal.id}')">Process</button>` :
            '<span class="text-muted">Processed</span>'
          }
        </td>
      </tr>
    `).join('');
  }

  filterWithdrawals(status) {
    let filteredWithdrawals = this.withdrawals;
    
    if (status) {
      filteredWithdrawals = filteredWithdrawals.filter(w => w.status === status);
    }
    
    this.displayWithdrawals(filteredWithdrawals);
  }

  processWithdrawalModal(withdrawalId) {
    const withdrawal = this.withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) return;

    // Populate modal
    document.getElementById('withdrawal-user-email').value = withdrawal.userEmail;
    document.getElementById('withdrawal-amount').value = formatCoins(withdrawal.amount);
    document.getElementById('withdrawal-method').value = withdrawal.method;
    document.getElementById('withdrawal-details').value = withdrawal.paymentDetails;
    
    // Store withdrawal ID
    document.getElementById('process-withdrawal').dataset.withdrawalId = withdrawalId;
    
    // Show modal
    document.getElementById('withdrawal-action-modal').classList.remove('d-none');
  }

  async processWithdrawal() {
    const withdrawalId = document.getElementById('process-withdrawal').dataset.withdrawalId;
    const action = document.getElementById('withdrawal-action').value;
    const notes = document.getElementById('withdrawal-notes').value;
    
    try {
      showLoader();
      const withdrawal = this.withdrawals.find(w => w.id === withdrawalId);
      
      // Update withdrawal status
      await updateDoc(doc(db, 'withdrawals', withdrawalId), {
        status: action === 'approve' ? 'approved' : 'rejected',
        processedDate: serverTimestamp(),
        processedBy: this.currentAdmin.uid,
        notes: notes
      });
      
      // If rejected, refund coins to user
      if (action === 'reject') {
        const userRef = doc(db, 'users', withdrawal.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentCoins = userDoc.data().coins || 0;
          await updateDoc(userRef, {
            coins: currentCoins + withdrawal.amount
          });
        }
      } else {
        // If approved, update user's total withdrawn
        const userRef = doc(db, 'users', withdrawal.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentWithdrawn = userDoc.data().totalWithdrawn || 0;
          await updateDoc(userRef, {
            totalWithdrawn: currentWithdrawn + withdrawal.amount
          });
        }
      }
      
      showToast(`Withdrawal ${action}d successfully`, 'success');
      document.getElementById('withdrawal-action-modal').classList.add('d-none');
      this.loadWithdrawals();
      hideLoader();
      
    } catch (error) {
      hideLoader();
      showToast('Error processing withdrawal', 'error');
    }
  }

  async loadTournaments() {
    try {
      showLoader();
      const tournamentsSnapshot = await getDocs(
        query(collection(db, 'tournaments'), orderBy('startDate', 'desc'))
      );
      
      this.tournaments = [];
      
      tournamentsSnapshot.forEach(doc => {
        this.tournaments.push({
          id: doc.id,
          ...doc.data()
        });
      });

      this.displayTournaments(this.tournaments);
      hideLoader();
      
    } catch (error) {
      hideLoader();
      console.error('Error loading tournaments:', error);
    }
  }

  displayTournaments(tournaments) {
    const tbody = document.getElementById('tournaments-table-body');
    
    tbody.innerHTML = tournaments.map(tournament => `
      <tr>
        <td>${tournament.name}</td>
        <td>${tournament.game}</td>
        <td>${formatCoins(tournament.entryFee)}</td>
        <td>${formatCoins(tournament.prizePool)}</td>
        <td>${tournament.participantCount || 0}/${tournament.maxParticipants}</td>
        <td>${formatDate(tournament.startDate.toDate())}</td>
        <td><span class="status-badge status-${tournament.status}">${tournament.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="adminManager.editTournament('${tournament.id}')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="adminManager.deleteTournament('${tournament.id}')">Delete</button>
        </td>
      </tr>
    `).join('');
  }

  showTournamentModal() {
    // Set default dates
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
    document.getElementById('tournament-start-date').value = tomorrow.toISOString().slice(0, 16);
    document.getElementById('tournament-end-date').value = dayAfter.toISOString().slice(0, 16);
    
    document.getElementById('tournament-modal').classList.remove('d-none');
  }

  async createTournament() {
    try {
      const tournamentData = {
        name: document.getElementById('tournament-name').value,
        game: document.getElementById('tournament-game').value,
        entryFee: parseInt(document.getElementById('tournament-entry-fee').value),
        prizePool: parseInt(document.getElementById('tournament-prize-pool').value),
        maxParticipants: parseInt(document.getElementById('tournament-max-participants').value),
        startDate: new Date(document.getElementById('tournament-start-date').value),
        endDate: new Date(document.getElementById('tournament-end-date').value),
        rules: document.getElementById('tournament-rules').value,
        status: 'upcoming',
        participants: [],
        participantCount: 0,
        createdAt: serverTimestamp(),
        createdBy: this.currentAdmin.uid
      };

      showLoader();
      await addDoc(collection(db, 'tournaments'), tournamentData);
      
      showToast('Tournament created successfully', 'success');
      document.getElementById('tournament-modal').classList.add('d-none');
      this.loadTournaments();
      hideLoader();
      
    } catch (error) {
      hideLoader();
      showToast('Error creating tournament', 'error');
    }
  }

  async deleteTournament(tournamentId) {
    if (!confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
      showLoader();
      await deleteDoc(doc(db, 'tournaments', tournamentId));
      showToast('Tournament deleted successfully', 'success');
      this.loadTournaments();
      hideLoader();
    } catch (error) {
      hideLoader();
      showToast('Error deleting tournament', 'error');
    }
  }

  async loadTaskSettings() {
    // Load current task settings from database or use defaults
    // This would typically come from a settings collection
    console.log('Loading task settings...');
  }

  async updateTaskSettings(taskType) {
    try {
      showLoader();
      
      let settings = {};
      
      switch (taskType) {
        case 'dailyRewards':
          settings = {
            baseReward: parseInt(document.getElementById('daily-base-reward').value),
            streakMultiplier: parseFloat(document.getElementById('daily-streak-multiplier').value)
          };
          break;
        case 'watchRewards':
          settings = {
            minCoins: parseInt(document.getElementById('watch-min-coins').value),
            maxCoins: parseInt(document.getElementById('watch-max-coins').value),
            cooldown: parseInt(document.getElementById('watch-cooldown').value)
          };
          break;
        case 'spinRewards':
          settings = {
            rewards: document.getElementById('spin-rewards').value.split(',').map(r => parseInt(r.trim())),
            cooldown: parseInt(document.getElementById('spin-cooldown').value)
          };
          break;
      }
      
      // Save to settings collection
      await updateDoc(doc(db, 'settings', taskType), settings);
      
      showToast(`${taskType} settings updated successfully`, 'success');
      hideLoader();
      
    } catch (error) {
      hideLoader();
      showToast('Error updating task settings', 'error');
    }
  }
}

// Global function to close modals
window.closeModal = function(modalId) {
  document.getElementById(modalId).classList.add('d-none');
};

// Initialize admin manager
const adminManager = new AdminManager();

// Make adminManager globally available for onclick handlers
window.adminManager = adminManager;

export default adminManager;