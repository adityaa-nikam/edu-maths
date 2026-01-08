# Edu Maths - Student Mobile App

React Native mobile application for students using Expo and TypeScript.

## 🎯 Target Platform
- **Primary**: Android
- **Future**: iOS

## 🏗️ Tech Stack
- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Auth**: Student JWT only

## 📁 Folder Structure

```
mobile/
├── app/                    # Expo Router screens (file-based routing)
│   ├── _layout.tsx        # Root layout with Stack navigation
│   └── index.tsx          # Home/Landing screen
├── components/            # Reusable UI components
├── services/              # API calls, auth, storage
├── store/                 # State management
├── assets/                # Images, fonts, etc.
└── package.json
```

## 🚀 Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
```bash
# Copy the example file
cp .env.example .env

# Edit .env and update with your local IP address
# See ENV_SETUP.md for detailed instructions
```

### 3. Start the development server
```bash
npm start
```

### Run on Android
```bash
npm run android
```

### Run on iOS (future)
```bash
npm run ios
```

## 📱 Features (MVP)
- Student authentication (JWT)
- Exam taking interface
- Results viewing
- Profile management

## 🔧 Development Notes
- No offline support in MVP
- No push notifications in MVP
- Teacher features are web-only
- Uses Stack + Tabs navigation pattern

## 📦 Key Dependencies
- `expo-router` - File-based navigation
- `react-native-gesture-handler` - Gesture support
- `react-native-reanimated` - Animations
- `expo-status-bar` - Status bar management

## 🌐 Backend Integration

Backend API configuration is managed through environment variables.  
See [ENV_SETUP.md](./ENV_SETUP.md) for detailed setup instructions.

**Development**: Configure your local IP in `.env`  
**Production**: Update `EXPO_PUBLIC_API_BASE_URL` for production API

---
Built with ❤️ for Edu Maths Platform
