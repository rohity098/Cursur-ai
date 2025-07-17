# GameLoot - mGamer-like Earning App

A complete Firebase-powered earning app similar to mGamer, built with HTML, CSS, and JavaScript. Features both user and admin panels with comprehensive earning modules, tournaments, and withdrawal systems.

## 🚀 Features

### User Panel Features

#### 🔐 Authentication
- **Email/Password Login & Registration**
- **Phone OTP Authentication** with resend functionality
- **Google OAuth Integration**
- **Account Linking** (Email + Phone to single account)
- **Secure Session Management**

#### 💰 Earning Modules
- **Watch & Earn**: Simulated rewarded video ads (50-100 coins per video)
- **Login & Earn**: Daily login rewards with streak bonuses
- **Play & Earn**: Interactive quiz games and challenges
- **Referral & Earn**: Unique referral codes with bonus rewards
- **Follow & Earn**: Social media following rewards
- **Join & Earn**: Event participation rewards
- **Spin & Win**: Daily fortune wheel with various rewards

#### 🏆 Tournament System
- **View Active Tournaments** (Free Fire, BGMI, etc.)
- **Join with Coins** as entry fee
- **Real-time Participant Tracking**
- **Prize Pool Display**
- **Tournament History**

#### 👤 User Profile
- **Player ID & Statistics**
- **Coin Balance & Earnings History**
- **Referral Code Management**
- **Account Information**

#### 💸 Withdrawal System
- **Multiple Payment Methods**:
  - Google Play Store Credits
  - PhonePe UPI
  - Google Pay UPI
- **Minimum Withdrawal Limits**
- **Request Status Tracking**
- **Withdrawal History**

### Admin Panel Features

#### 📊 Dashboard Overview
- **Real-time Statistics**
- **User Analytics**
- **Revenue Tracking**
- **Recent Activity Feed**

#### 👥 User Management
- **Complete User Database**
- **Search & Filter Users**
- **Edit User Balances**
- **Coin Management** (Add/Deduct)
- **Task Reset Functionality**

#### 💳 Withdrawal Management
- **Process Withdrawal Requests**
- **Approve/Reject with Notes**
- **Automatic Coin Refunding**
- **Payment Tracking**

#### 🏅 Tournament Control
- **Create New Tournaments**
- **Edit Tournament Details**
- **Manage Participants**
- **Prize Distribution**

#### ⚙️ Task Management
- **Configure Earning Rates**
- **Set Cooldown Periods**
- **Update Reward Structures**
- **Spin Wheel Configuration**

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Firestore, Auth, Hosting)
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Hosting**: Firebase Hosting
- **Icons**: Font Awesome 6
- **Fonts**: Google Fonts (Inter)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- Firebase CLI
- A Firebase project

### 1. Clone the Repository
```bash
git clone <repository-url>
cd gameloot-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication, Firestore, and Hosting

#### Configure Authentication
1. Go to Authentication → Sign-in method
2. Enable:
   - Email/Password
   - Phone
   - Google
3. Add your domain to authorized domains

#### Setup Firestore
1. Go to Firestore Database
2. Create database in production mode
3. Deploy the security rules:
```bash
firebase deploy --only firestore:rules
```

#### Get Firebase Config
1. Go to Project Settings → General
2. Scroll to "Your apps" section
3. Add a web app
4. Copy the Firebase configuration

### 4. Update Configuration
Edit `js/firebase-config.js` with your Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

### 5. Create Admin User
1. Register a user through the app
2. Get the user's UID from Firebase Console
3. Add admin document to Firestore:
```javascript
// In Firestore Console, create collection 'admins'
// Add document with ID = user's UID
{
  email: "admin@example.com",
  role: "admin",
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
}
```

### 6. Deploy to Firebase
```bash
# Initialize Firebase (if not done)
firebase init

# Deploy the app
firebase deploy
```

### 7. Local Development
```bash
# Start local server
npm start

# Or use Firebase emulators
firebase emulators:start
```

## 🎯 Usage

### For Users
1. **Registration**: Sign up with email/phone or Google
2. **Earning**: Complete various tasks to earn coins
3. **Tournaments**: Join gaming tournaments with entry fees
4. **Withdrawals**: Request withdrawals through supported methods
5. **Referrals**: Share referral code to earn bonus coins

### For Admins
1. **Login**: Use admin credentials at `/admin.html`
2. **Monitor**: View real-time statistics and user activity
3. **Manage**: Control user accounts and coin balances
4. **Process**: Handle withdrawal requests manually
5. **Configure**: Set up tournaments and earning rates

## 🔧 Configuration

### Earning Rates
Edit these values in the admin panel or code:
- Daily Login: 50-200 coins (based on streak)
- Watch & Earn: 50-100 coins per video
- Play & Earn: 75 coins per correct answer
- Referral Bonus: 200 coins per referral
- Social Follow: 50 coins per platform
- Spin Wheel: 10-500 coins (configurable)

### Withdrawal Limits
- Google Play: 1000 coins minimum
- PhonePe: 500 coins minimum
- Google Pay: 500 coins minimum

### Cooldown Periods
- Watch & Earn: 5 minutes
- Daily Login: 24 hours
- Spin Wheel: 24 hours

## 📱 Mobile Responsiveness

The app is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktop (1024px+)

## 🔒 Security Features

- **Firebase Security Rules** for data protection
- **Authentication Required** for all operations
- **Admin Role Verification** for admin functions
- **Input Validation** on all forms
- **XSS Protection** through proper escaping

## 🚀 Performance Optimizations

- **Lazy Loading** of sections
- **Efficient Firebase Queries** with indexing
- **Caching** of user data
- **Debounced Search** functionality
- **Optimized CSS** with minimal reflows

## 🎨 Customization

### Themes
Edit `css/style.css` to customize:
- Color scheme
- Typography
- Layout spacing
- Component styles

### Earning Modules
Add new earning methods by:
1. Creating new UI components
2. Adding backend logic
3. Updating user data structure
4. Implementing cooldown systems

### Games Integration
To integrate real games:
1. Replace quiz system with game APIs
2. Implement score verification
3. Add game-specific rewards
4. Create leaderboards

## 📊 Analytics & Monitoring

The app includes built-in analytics for:
- User registration and activity
- Earning patterns and trends
- Withdrawal success rates
- Tournament participation
- Referral effectiveness

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection Error**
   - Check Firebase config in `firebase-config.js`
   - Verify project ID and API keys
   - Ensure Firestore rules are deployed

2. **Authentication Not Working**
   - Check enabled sign-in methods
   - Verify authorized domains
   - Test with different browsers

3. **Admin Panel Access Denied**
   - Ensure admin document exists in Firestore
   - Check user UID matches admin document ID
   - Verify Firestore security rules

4. **Withdrawal Processing Issues**
   - Check admin permissions
   - Verify withdrawal document structure
   - Ensure proper status updates

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Firebase documentation

## 🔄 Updates & Roadmap

### Planned Features
- [ ] Real ad network integration
- [ ] Advanced tournament brackets
- [ ] Social features and chat
- [ ] Push notifications
- [ ] Mobile app version
- [ ] Cryptocurrency withdrawals
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Recent Updates
- ✅ Complete user authentication system
- ✅ Comprehensive earning modules
- ✅ Tournament management system
- ✅ Admin panel with full controls
- ✅ Withdrawal processing system
- ✅ Mobile-responsive design

---

**Built with ❤️ for the gaming community**