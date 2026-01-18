# Win Win

## Tech Stack

- Frontend: React Native + Expo
- Backend: ?
- Testing: Expo Go on iPhone

## 📋 Prerequisites

Make sure you have these installed:
- Node.js
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
# or
npx expo start --tunnel  (this is the one that works for me)
```

### 4. Run on your iPhone
1. Open the Expo Go app on your iPhone
2. Scan the QR code shown in your terminal

## initial project structure

```
barter-app/
├── app/                    # App screens (Expo Router file-based routing)
│   ├── _layout.tsx        # Root layout with navigation
│   ├── feed.tsx          # Home screen
│   ├── barter.tsx       # Browse listings screen
│   └── profile.tsx        # User profile screen
├── components/
    ├── card.tsx   
├── assets/                # Images, fonts, etc. 
├── app.json              # Expo configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md            # This file
```

## Features (To Be Implemented)


## 🔧 Development Tips

### Hot Reload
Expo supports hot reload! Changes you make will automatically appear on your phone.

### Debugging
- Shake your phone to open the Expo dev menu
- Use React Native Debugger for advanced debugging

## 📱 Building for Production

Deploy:

```bash
# Build for iOS (requires Expo account)
eas build --platform ios

# Build for Android
eas build --platform android
```

