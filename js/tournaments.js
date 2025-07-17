import { db } from './firebase-config.js';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { showToast, showLoader, hideLoader, formatDate } from './utils.js';
import authManager from './auth.js';

class TournamentManager {
  constructor() {
    this.userData = null;
    this.tournaments = [];
    this.initializeTournaments();
  }

  initializeTournaments() {
    // Listen for user data updates
    window.addEventListener('userDataLoaded', (event) => {
      this.userData = event.detail;
      this.loadTournaments();
    });

    // Load tournaments when tournaments section is shown
    document.querySelector('[data-section="tournaments"]').addEventListener('click', () => {
      this.loadTournaments();
    });
  }

  async loadTournaments() {
    try {
      showLoader();
      
      const tournamentsRef = collection(db, 'tournaments');
      const q = query(
        tournamentsRef,
        where('status', 'in', ['upcoming', 'active']),
        orderBy('startDate', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      this.tournaments = [];
      
      querySnapshot.forEach((doc) => {
        this.tournaments.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      this.displayTournaments();
      hideLoader();
      
    } catch (error) {
      hideLoader();
      console.error('Error loading tournaments:', error);
      this.displayEmptyState();
    }
  }

  displayTournaments() {
    const container = document.getElementById('tournament-list');
    
    if (this.tournaments.length === 0) {
      this.displayEmptyState();
      return;
    }
    
    container.innerHTML = this.tournaments.map(tournament => `
      <div class="tournament-item">
        <div class="tournament-info">
          <h4>${tournament.name}</h4>
          <p>Game: ${tournament.game}</p>
          <p>Entry Fee: ${tournament.entryFee} coins</p>
          <p>Prize Pool: ${tournament.prizePool} coins</p>
          <p>Start Date: ${formatDate(tournament.startDate.toDate())}</p>
          <p>Status: <span class="status-badge status-${tournament.status}">${tournament.status}</span></p>
        </div>
        <div class="tournament-actions">
          ${this.getTournamentActions(tournament)}
        </div>
      </div>
    `).join('');

    // Bind action buttons
    container.querySelectorAll('.join-tournament-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tournamentId = e.target.dataset.tournamentId;
        this.joinTournament(tournamentId);
      });
    });
  }

  getTournamentActions(tournament) {
    if (!this.userData) return '';
    
    const userCoins = this.userData.coins || 0;
    const canAfford = userCoins >= tournament.entryFee;
    const alreadyJoined = tournament.participants && tournament.participants.includes(authManager.currentUser.uid);
    
    if (alreadyJoined) {
      return '<span class="status-badge status-active">Joined</span>';
    }
    
    if (tournament.status === 'upcoming' && canAfford) {
      return `<button class="btn btn-primary btn-sm join-tournament-btn" data-tournament-id="${tournament.id}">
        Join Tournament
      </button>`;
    }
    
    if (!canAfford) {
      return `<button class="btn btn-secondary btn-sm" disabled>
        Need ${tournament.entryFee - userCoins} more coins
      </button>`;
    }
    
    return '<span class="status-badge status-pending">Tournament Started</span>';
  }

  async joinTournament(tournamentId) {
    try {
      showLoader();
      
      const tournament = this.tournaments.find(t => t.id === tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }
      
      const userCoins = this.userData.coins || 0;
      if (userCoins < tournament.entryFee) {
        throw new Error('Insufficient coins');
      }
      
      // Deduct entry fee from user
      const userRef = doc(db, 'users', authManager.currentUser.uid);
      await updateDoc(userRef, {
        coins: userCoins - tournament.entryFee
      });
      
      // Add user to tournament participants
      const tournamentRef = doc(db, 'tournaments', tournamentId);
      const tournamentDoc = await getDoc(tournamentRef);
      const tournamentData = tournamentDoc.data();
      
      const participants = tournamentData.participants || [];
      participants.push(authManager.currentUser.uid);
      
      await updateDoc(tournamentRef, {
        participants: participants,
        participantCount: participants.length
      });
      
      // Log transaction
      await this.logTransaction(-tournament.entryFee, `Tournament Entry: ${tournament.name}`);
      
      // Update local data
      this.userData.coins = userCoins - tournament.entryFee;
      document.getElementById('coin-count').textContent = this.userData.coins;
      
      showToast(`Successfully joined ${tournament.name}!`, 'success');
      
      // Refresh tournaments display
      this.loadTournaments();
      
      hideLoader();
      
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
    }
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

  displayEmptyState() {
    const container = document.getElementById('tournament-list');
    container.innerHTML = `
      <div class="text-center" style="padding: 2rem;">
        <i class="fas fa-trophy" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
        <h3>No Active Tournaments</h3>
        <p>Check back later for exciting tournaments!</p>
      </div>
    `;
  }

  // Sample tournaments for demo (would be created by admin)
  async createSampleTournaments() {
    const sampleTournaments = [
      {
        name: 'Free Fire Battle Royale',
        game: 'Free Fire',
        entryFee: 100,
        prizePool: 5000,
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endDate: new Date(Date.now() + 25 * 60 * 60 * 1000), // Day after tomorrow
        status: 'upcoming',
        maxParticipants: 50,
        participants: [],
        participantCount: 0,
        rules: 'Standard Battle Royale rules apply',
        createdAt: serverTimestamp()
      },
      {
        name: 'BGMI Squad Championship',
        game: 'BGMI',
        entryFee: 200,
        prizePool: 10000,
        startDate: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
        endDate: new Date(Date.now() + 49 * 60 * 60 * 1000),
        status: 'upcoming',
        maxParticipants: 100,
        participants: [],
        participantCount: 0,
        rules: 'Squad mode, 4 players per team',
        createdAt: serverTimestamp()
      }
    ];

    try {
      const tournamentsRef = collection(db, 'tournaments');
      for (const tournament of sampleTournaments) {
        await addDoc(tournamentsRef, tournament);
      }
      console.log('Sample tournaments created');
    } catch (error) {
      console.error('Error creating sample tournaments:', error);
    }
  }
}

// Initialize tournament manager
const tournamentManager = new TournamentManager();

export default tournamentManager;