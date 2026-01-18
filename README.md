# 🔄 Barter App

A React Native + Expo app for trading goods and services without money.

## 🚀 Tech Stack

- **Frontend**: React Native + Expo (managed workflow)
- **Language**: TypeScript
- **Navigation**: Expo Router
- **Development**: Windows/WSL + VS Code
- **Testing**: Expo Go on iPhone

## 📋 Prerequisites

Make sure you have these installed:
- Node.js (✅ already installed)
- npm or yarn
- Expo Go app on your iPhone ([Download from App Store](https://apps.apple.com/app/expo-go/id982107779))

## 🛠️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/samcasebeer539/barter-app.git
cd barter-app
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm start
# or
npx expo start
```

### 4. Run on your iPhone
1. Open the Expo Go app on your iPhone
2. Scan the QR code shown in your terminal (or press 'w' to open in web browser)
3. The app will load on your phone!

## 📁 Project Structure

```
barter-app/
├── app/                    # App screens (Expo Router file-based routing)
│   ├── _layout.tsx        # Root layout with navigation
│   ├── index.tsx          # Home screen
│   ├── listings.tsx       # Browse listings screen
│   └── profile.tsx        # User profile screen
├── assets/                # Images, fonts, etc. (you'll need to add these)
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## 🎨 Features (To Be Implemented)

- [ ] User authentication (sign up/login)
- [ ] Create listings (goods & services)
- [ ] Browse and search listings
- [ ] Direct messaging between users
- [ ] Negotiation system
- [ ] Rating/review system
- [ ] Image upload for listings
- [ ] Push notifications
- [ ] Location-based filtering

## 🔧 Development Tips

### Running in WSL
If you're developing in WSL, make sure:
1. Your project is in the Linux filesystem (not /mnt/c/...)
2. You have Node.js installed in WSL
3. Run `npx expo start --tunnel` if you have network issues

### Hot Reload
Expo supports hot reload! Changes you make will automatically appear on your phone.

### Debugging
- Press `j` in terminal to open debugger
- Shake your phone to open the Expo dev menu
- Use React Native Debugger for advanced debugging

## 📱 Building for Production

When you're ready to deploy:

```bash
# Build for iOS (requires Expo account)
eas build --platform ios

# Build for Android
eas build --platform android
```

## 🤝 Contributing

This is a personal project, but feel free to fork and modify!

## 📄 License

MIT

---

**Happy Bartering! 🔄**
