# Gaming Tournament Hub

A fully functional HTML-based gaming tournament platform for Free Fire and BGMI tournaments with separate User and Admin panels, powered by Firebase.

## 🎮 Features

### User Panel
- **Dashboard**: View tournament statistics, recent tournaments, and upcoming events
- **Tournament Browser**: Browse and filter available tournaments by game type and status
- **Join Tournaments**: Easy tournament registration with team name and game ID
- **My Tournaments**: Track joined tournaments and results
- **Profile Management**: Update personal information and game IDs
- **Leaderboard**: View global rankings and statistics
- **Authentication**: Secure login and registration system

### Admin Panel
- **Dashboard**: Comprehensive overview with statistics and recent activity
- **Tournament Management**: Create, edit, and manage tournaments
- **User Management**: View and manage registered users
- **Analytics**: Charts and insights on platform performance
- **Settings**: Configure platform settings and game options
- **Real-time Updates**: Live data synchronization via Firebase

## 🏗️ Project Structure

```
tournament-hub/
├── index.html              # Landing page
├── user-panel.html         # User dashboard and features
├── admin-panel.html        # Admin dashboard and management
├── styles/
│   ├── main.css           # Global styles and variables
│   ├── user-panel.css     # User panel specific styles
│   └── admin-panel.css    # Admin panel specific styles
├── js/
│   ├── firebase-config.js # Firebase configuration and utilities
│   ├── main.js           # Landing page functionality
│   ├── user-panel.js     # User panel functionality
│   └── admin-panel.js    # Admin panel functionality
└── README.md             # Project documentation
```

## 🚀 Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Firebase project (for backend functionality)
- Web server (for local development)

### Installation

1. **Clone or download the project files**
   ```bash
   git clone <repository-url>
   cd tournament-hub
   ```

2. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create Firestore Database
   - Get your Firebase configuration

3. **Configure Firebase**
   - Open `js/firebase-config.js`
   - Replace the placeholder configuration with your Firebase project config:
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

4. **Set up Firestore Database**
   Create the following collections in your Firestore database:
   - `users` - User profiles and statistics
   - `tournaments` - Tournament information
   - `participants` - Tournament participants
   - `results` - Tournament results
   - `settings` - Platform settings

5. **Run the application**
   - For local development, use a local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
   - Open your browser and navigate to `http://localhost:8000`

## 🎯 Usage

### For Users
1. **Registration**: Click "Join as Player" on the landing page
2. **Login**: Use the authentication modal to sign in
3. **Browse Tournaments**: Explore available tournaments in the tournaments section
4. **Join Tournament**: Click "Join" on any open tournament
5. **Track Progress**: Monitor your tournaments in "My Tournaments"
6. **Update Profile**: Complete your profile with game IDs and personal information

### For Admins
1. **Admin Access**: Click "Admin Panel" on the landing page
2. **Authentication**: Use admin credentials (demo: admin key = "admin123")
3. **Create Tournaments**: Use the "Create Tournament" button
4. **Manage Users**: View and manage registered users
5. **View Analytics**: Check platform performance and statistics
6. **Configure Settings**: Adjust platform settings and game options

## 🔧 Customization

### Styling
- **Colors**: Modify CSS variables in `styles/main.css`
- **Layout**: Adjust grid layouts and spacing
- **Components**: Customize individual component styles

### Functionality
- **Games**: Add new games by updating the game type options
- **Features**: Extend functionality by adding new sections
- **Integrations**: Connect with payment gateways or other services

### Firebase Rules
Set up Firestore security rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tournaments are readable by all, writable by admins
    match /tournaments/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Participants can be created by authenticated users
    match /participants/{document} {
      allow read, create: if request.auth != null;
      allow update, delete: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

## 📱 Responsive Design

The application is fully responsive and works on:
- **Desktop**: Full-featured experience
- **Tablet**: Adapted layout with touch-friendly controls
- **Mobile**: Optimized mobile interface

## 🔐 Security Features

- **Authentication**: Secure user authentication via Firebase
- **Data Validation**: Client and server-side validation
- **Role-based Access**: Separate permissions for users and admins
- **Secure API**: Protected Firebase backend

## 🎨 UI/UX Features

- **Modern Design**: Clean, gradient-based interface
- **Dark Theme**: Admin panel with dark sidebar
- **Interactive Elements**: Hover effects and animations
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Modal System**: Clean modal dialogs for forms

## 📊 Data Structure

### User Document
```javascript
{
  uid: "user-id",
  email: "user@example.com",
  displayName: "Player Name",
  role: "user", // or "admin"
  stats: {
    tournamentsJoined: 0,
    wins: 0,
    points: 0
  },
  gameIds: {
    freefire: "game-id",
    bgmi: "game-id"
  },
  profile: {
    phone: "phone-number",
    country: "country-code"
  }
}
```

### Tournament Document
```javascript
{
  tournamentName: "Tournament Name",
  gameType: "freefire", // or "bgmi"
  status: "open", // "ongoing", "completed"
  maxParticipants: 100,
  participantCount: 0,
  entryFee: 10,
  prizePool: {
    first: 500,
    second: 300,
    third: 200
  },
  startDate: "2024-01-15T10:00:00Z",
  endDate: "2024-01-15T18:00:00Z",
  description: "Tournament description",
  rules: "Tournament rules"
}
```

## 🚀 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize Firebase: `firebase init hosting`
3. Deploy: `firebase deploy`

### Other Hosting Options
- **Netlify**: Drag and drop deployment
- **Vercel**: Git-based deployment
- **GitHub Pages**: Static site hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎮 Demo Credentials

### User Panel
- **Email**: Any valid email
- **Password**: Any password (demo mode)

### Admin Panel
- **Email**: admin@example.com
- **Password**: Any password
- **Admin Key**: admin123

## 🔗 External Dependencies

- **Firebase**: Backend services
- **Font Awesome**: Icons
- **Chart.js**: Analytics charts (admin panel)
- **Google Fonts**: Typography (optional)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

**Built with ❤️ for the gaming community**