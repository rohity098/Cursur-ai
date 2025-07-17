# GameLoot - Earning App

A modern, clean HTML frontend for a gaming earning app built with Firebase Authentication, Firebase Realtime Database, and Tailwind CSS.

## Features

### User Features
- **Google Sign-In Authentication** - Secure login with Google accounts
- **User Dashboard** - Clean interface showing user stats and earnings
- **Referral System** - Earn coins by referring friends with unique referral codes
- **Withdrawal System** - Request withdrawals via GPay, PhonePe, or Play Store credits
- **Tournament System** - Join and create Free Fire/BGMI tournaments
- **Coin Management** - Track earnings and spending
- **Responsive Design** - Works on desktop and mobile devices

### Admin Features
- **Admin Dashboard** - Overview of platform statistics
- **Tournament Management** - Create and manage tournaments
- **Withdrawal Management** - Approve/reject withdrawal requests
- **Player Management** - View and manage all registered players
- **Reward System** - Send coins to players manually
- **Real-time Updates** - Live data synchronization

## Technology Stack

- **Frontend**: HTML5, Tailwind CSS, JavaScript
- **Authentication**: Firebase Authentication (Google Sign-In)
- **Database**: Firebase Realtime Database
- **Icons**: Font Awesome 6
- **Styling**: Tailwind CSS with custom configuration

## File Structure

```
├── index.html              # Main user application
├── admin.html              # Admin panel
├── js/
│   ├── firebase-config.js  # Firebase configuration and utilities
│   ├── auth.js            # User authentication logic
│   ├── app.js             # Main app functionality
│   ├── admin-auth.js      # Admin authentication
│   └── admin.js           # Admin panel functionality
└── README.md              # This file
```

## Setup Instructions

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable the following services:
   - **Authentication** (Google Sign-In provider)
   - **Realtime Database**

### 2. Firebase Configuration

1. In your Firebase project, go to Project Settings
2. In the "Your apps" section, click "Add app" and select Web
3. Register your app and copy the configuration object
4. Replace the placeholder configuration in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "your-actual-api-key",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "your-sender-id",
    appId: "your-app-id"
};
```

### 3. Authentication Setup

1. In Firebase Console, go to Authentication > Sign-in method
2. Enable Google Sign-In provider
3. Add your domain to authorized domains

### 4. Database Setup

1. Go to Realtime Database in Firebase Console
2. Create a database in test mode (you can configure security rules later)
3. The app will automatically create the required data structure

### 5. Admin Configuration

1. Open `js/firebase-config.js`
2. Add admin email addresses to the `ADMIN_EMAILS` array:

```javascript
const ADMIN_EMAILS = [
    'your-admin-email@gmail.com',
    'another-admin@gmail.com'
];
```

### 6. Database Security Rules

Replace the default rules in Firebase Realtime Database with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    },
    "withdrawals": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tournaments": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "referrals": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "rewards": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## Database Structure

The app uses the following Firebase Realtime Database structure:

```
├── users/
│   └── {userId}/
│       ├── uid: string
│       ├── email: string
│       ├── displayName: string
│       ├── photoURL: string
│       ├── playerId: string (first 8 chars of UID)
│       ├── referralId: string (first 6 chars of UID)
│       ├── coins: number
│       ├── referralCount: number
│       ├── referralEarnings: number
│       ├── createdAt: timestamp
│       └── lastLogin: timestamp
├── withdrawals/
│   └── {withdrawalId}/
│       ├── uid: string
│       ├── amount: number
│       ├── method: string (gpay|phonepe|playstore)
│       ├── details: string
│       ├── status: string (pending|approved|rejected)
│       ├── userEmail: string
│       ├── userName: string
│       └── createdAt: timestamp
├── tournaments/
│   └── {tournamentId}/
│       ├── name: string
│       ├── game: string (freefire|bgmi)
│       ├── prize: number
│       ├── maxPlayers: number
│       ├── status: string (active|completed|cancelled)
│       ├── participants: object
│       ├── createdBy: string
│       └── createdAt: timestamp
├── referrals/
│   └── {referralId}/
│       ├── referrerId: string
│       ├── referredUid: string
│       ├── referredData: object
│       ├── reward: number
│       └── createdAt: timestamp
└── rewards/
    └── {rewardId}/
        ├── uid: string
        ├── amount: number
        ├── reason: string
        └── createdAt: timestamp
```

## Deployment

### Option 1: Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init hosting`
4. Deploy: `firebase deploy`

### Option 2: Static Hosting

Upload all files to any static hosting service like:
- Netlify
- Vercel
- GitHub Pages
- Any web server

## Usage

### For Users
1. Visit the main app URL
2. Sign in with Google
3. Complete profile setup
4. Start earning coins through various activities
5. Refer friends using your unique referral code
6. Request withdrawals when you have enough coins

### For Admins
1. Visit `/admin.html`
2. Sign in with an admin Google account
3. Manage tournaments, withdrawals, and players
4. Send rewards to users
5. Monitor platform statistics

## Features in Detail

### Referral System
- Each user gets a unique 6-character referral ID
- Referral links: `https://yourapp.com?ref=REFID`
- Referrers earn 50 coins per successful referral
- Real-time tracking of referral earnings

### Withdrawal System
- Minimum withdrawal: 100 coins
- Supported methods: GPay, PhonePe, Play Store credits
- Admin approval required for all withdrawals
- Automatic coin deduction upon request

### Tournament System
- Support for Free Fire and BGMI games
- Admin-created tournaments
- Prize pools in coins
- Player participation tracking

## Customization

### Styling
- Edit Tailwind configuration in HTML files
- Modify color scheme in the `tailwind.config` object
- Add custom CSS classes as needed

### Functionality
- Add new earning methods in `js/app.js`
- Modify coin values in `js/firebase-config.js`
- Add new games in tournament creation

## Security Notes

- Admin access is controlled by email whitelist
- All database operations require authentication
- Withdrawal requests are logged and require approval
- User data is protected by Firebase security rules

## Support

For support and customization requests, please check the code comments and Firebase documentation.

## License

This project is provided as-is for educational and commercial use.