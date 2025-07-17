import { auth, db } from './firebase-config.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  linkWithCredential,
  PhoneAuthProvider,
  EmailAuthProvider,
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { generateReferralCode, showToast, showLoader, hideLoader, validateEmail, validatePhone } from './utils.js';

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
    this.initializeAuth();
  }

  initializeAuth() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      if (user) {
        this.showApp();
        this.loadUserData();
      } else {
        this.showAuth();
      }
    });
  }

  showAuth() {
    document.getElementById('auth-section').classList.remove('d-none');
    document.getElementById('app-section').classList.add('d-none');
  }

  showApp() {
    document.getElementById('auth-section').classList.add('d-none');
    document.getElementById('app-section').classList.remove('d-none');
  }

  async loadUserData() {
    try {
      const userDoc = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        document.getElementById('coin-count').textContent = userData.coins || 0;
        // Dispatch event to update other components
        window.dispatchEvent(new CustomEvent('userDataLoaded', { detail: userData }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  async register(email, phone, password, referralCode = '') {
    try {
      showLoader();
      
      if (!validateEmail(email)) {
        throw new Error('Invalid email format');
      }
      
      if (!validatePhone(phone)) {
        throw new Error('Invalid phone number format');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document
      const userData = {
        uid: user.uid,
        email: email,
        phone: phone,
        coins: 100, // Welcome bonus
        referralCode: generateReferralCode(),
        referredBy: referralCode,
        referrals: 0,
        totalEarned: 100,
        totalWithdrawn: 0,
        joinDate: serverTimestamp(),
        lastLogin: serverTimestamp(),
        loginStreak: 1,
        tasks: {
          dailyLogin: null,
          watchAd: null,
          follow: {
            youtube: false,
            instagram: false,
            facebook: false
          },
          spin: null
        }
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Handle referral bonus
      if (referralCode) {
        await this.processReferralBonus(referralCode, user.uid);
      }

      showToast('Registration successful! Welcome bonus: 100 coins', 'success');
      hideLoader();
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
      throw error;
    }
  }

  async login(emailOrPhone, password) {
    try {
      showLoader();
      
      let email = emailOrPhone;
      if (!validateEmail(emailOrPhone)) {
        // Try to find user by phone
        const phoneQuery = query(
          collection(db, 'users'),
          where('phone', '==', emailOrPhone)
        );
        const phoneSnapshot = await getDocs(phoneQuery);
        
        if (phoneSnapshot.empty) {
          throw new Error('User not found');
        }
        
        email = phoneSnapshot.docs[0].data().email;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await this.updateLoginStreak(userCredential.user.uid);
      
      showToast('Login successful!', 'success');
      hideLoader();
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
      throw error;
    }
  }

  async googleLogin() {
    try {
      showLoader();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = {
          uid: user.uid,
          email: user.email,
          phone: user.phoneNumber || '',
          coins: 100,
          referralCode: generateReferralCode(),
          referredBy: '',
          referrals: 0,
          totalEarned: 100,
          totalWithdrawn: 0,
          joinDate: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginStreak: 1,
          tasks: {
            dailyLogin: null,
            watchAd: null,
            follow: {
              youtube: false,
              instagram: false,
              facebook: false
            },
            spin: null
          }
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        showToast('Welcome! You received 100 coins as welcome bonus', 'success');
      } else {
        await this.updateLoginStreak(user.uid);
        showToast('Login successful!', 'success');
      }
      
      hideLoader();
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
      throw error;
    }
  }

  async sendOTP(phoneNumber) {
    try {
      showLoader();
      
      if (!this.recaptchaVerifier) {
        this.recaptchaVerifier = new RecaptchaVerifier(auth, 'send-otp-btn', {
          size: 'invisible',
          callback: (response) => {
            console.log('reCAPTCHA solved');
          }
        });
      }

      const appVerifier = this.recaptchaVerifier;
      this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      
      showToast('OTP sent successfully!', 'success');
      hideLoader();
      
      // Show OTP verification form
      document.getElementById('otp-verification').classList.remove('d-none');
      
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
      throw error;
    }
  }

  async verifyOTP(code) {
    try {
      showLoader();
      
      if (!this.confirmationResult) {
        throw new Error('Please send OTP first');
      }

      const result = await this.confirmationResult.confirm(code);
      const user = result.user;

      // Check if user exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new user document
        const userData = {
          uid: user.uid,
          email: user.email || '',
          phone: user.phoneNumber,
          coins: 100,
          referralCode: generateReferralCode(),
          referredBy: '',
          referrals: 0,
          totalEarned: 100,
          totalWithdrawn: 0,
          joinDate: serverTimestamp(),
          lastLogin: serverTimestamp(),
          loginStreak: 1,
          tasks: {
            dailyLogin: null,
            watchAd: null,
            follow: {
              youtube: false,
              instagram: false,
              facebook: false
            },
            spin: null
          }
        };

        await setDoc(doc(db, 'users', user.uid), userData);
        showToast('Welcome! You received 100 coins as welcome bonus', 'success');
      } else {
        await this.updateLoginStreak(user.uid);
        showToast('Login successful!', 'success');
      }
      
      hideLoader();
    } catch (error) {
      hideLoader();
      showToast(error.message, 'error');
      throw error;
    }
  }

  async updateLoginStreak(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastLogin = userData.lastLogin?.toDate();
        const today = new Date();
        
        let newStreak = 1;
        if (lastLogin) {
          const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            newStreak = (userData.loginStreak || 1) + 1;
          } else if (daysDiff === 0) {
            newStreak = userData.loginStreak || 1;
          }
        }

        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          loginStreak: newStreak
        });
      }
    } catch (error) {
      console.error('Error updating login streak:', error);
    }
  }

  async processReferralBonus(referralCode, newUserId) {
    try {
      // Find user who referred
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('referralCode', '==', referralCode));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const referrerDoc = querySnapshot.docs[0];
        const referrerData = referrerDoc.data();
        
        // Update referrer's coins and referral count
        await updateDoc(referrerDoc.ref, {
          coins: (referrerData.coins || 0) + 200, // Referral bonus
          referrals: (referrerData.referrals || 0) + 1,
          totalEarned: (referrerData.totalEarned || 0) + 200
        });
        
        // Update new user's referral info
        await updateDoc(doc(db, 'users', newUserId), {
          referredBy: referralCode
        });
      }
    } catch (error) {
      console.error('Error processing referral bonus:', error);
    }
  }

  async logout() {
    try {
      await signOut(auth);
      showToast('Logged out successfully', 'info');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
export default authManager;