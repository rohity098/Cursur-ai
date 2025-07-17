import authManager from './auth.js';
import earningManager from './earning.js';
import { showToast } from './utils.js';

class App {
  constructor() {
    this.currentSection = 'dashboard';
    this.initializeApp();
  }

  initializeApp() {
    this.bindAuthEvents();
    this.bindNavigationEvents();
    this.bindFormEvents();
  }

  bindAuthEvents() {
    // Login form
    document.getElementById('login-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      if (!email || !password) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      
      try {
        await authManager.login(email, password);
      } catch (error) {
        // Error handled in auth manager
      }
    });

    // Register form
    document.getElementById('register-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('register-email').value;
      const phone = document.getElementById('register-phone').value;
      const password = document.getElementById('register-password').value;
      const confirmPassword = document.getElementById('register-confirm-password').value;
      const referralCode = document.getElementById('referral-code').value;
      
      if (!email || !phone || !password || !confirmPassword) {
        showToast('Please fill in all fields', 'error');
        return;
      }
      
      if (password !== confirmPassword) {
        showToast('Passwords do not match', 'error');
        return;
      }
      
      try {
        await authManager.register(email, phone, password, referralCode);
      } catch (error) {
        // Error handled in auth manager
      }
    });

    // Google login
    document.getElementById('google-login-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await authManager.googleLogin();
      } catch (error) {
        // Error handled in auth manager
      }
    });

    // Phone OTP
    document.getElementById('send-otp-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('otp-phone').value;
      
      if (!phone) {
        showToast('Please enter phone number', 'error');
        return;
      }
      
      try {
        await authManager.sendOTP(phone);
      } catch (error) {
        // Error handled in auth manager
      }
    });

    document.getElementById('verify-otp-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const code = document.getElementById('otp-code').value;
      
      if (!code) {
        showToast('Please enter OTP code', 'error');
        return;
      }
      
      try {
        await authManager.verifyOTP(code);
      } catch (error) {
        // Error handled in auth manager
      }
    });

    document.getElementById('resend-otp-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      const phone = document.getElementById('otp-phone').value;
      
      try {
        await authManager.sendOTP(phone);
      } catch (error) {
        // Error handled in auth manager
      }
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', async (e) => {
      e.preventDefault();
      await authManager.logout();
    });

    // Form switching
    document.getElementById('show-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.showForm('register');
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.showForm('login');
    });

    document.getElementById('show-phone-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.showForm('phone-otp');
    });

    document.getElementById('back-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.showForm('login');
    });
  }

  bindNavigationEvents() {
    // Sidebar navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;
        this.showSection(section);
      });
    });
  }

  bindFormEvents() {
    // Enter key support for forms
    document.querySelectorAll('input').forEach(input => {
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          const form = e.target.closest('.auth-form');
          if (form) {
            const submitBtn = form.querySelector('.btn-primary');
            if (submitBtn) {
              submitBtn.click();
            }
          }
        }
      });
    });
  }

  showForm(formType) {
    // Hide all forms
    document.querySelectorAll('.auth-form').forEach(form => {
      form.classList.add('d-none');
    });

    // Show selected form
    document.getElementById(`${formType}-form`).classList.remove('d-none');
  }

  showSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

    // Update content
    document.querySelectorAll('.content-section').forEach(section => {
      section.classList.add('d-none');
    });
    document.getElementById(`${sectionName}-section`).classList.remove('d-none');

    this.currentSection = sectionName;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new App();
});

export default App;