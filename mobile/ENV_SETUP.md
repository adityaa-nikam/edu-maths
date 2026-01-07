# Environment Configuration Guide

## Overview

This mobile app uses **Expo's environment variable system** to manage configuration securely. All environment variables use the `EXPO_PUBLIC_` prefix to be accessible in the client-side code.

## 🔐 Security Principles

- ✅ **No secrets in code**: All configuration is in `.env` files
- ✅ **Git-ignored**: `.env` is in `.gitignore` to prevent commits
- ✅ **Template provided**: `.env.example` shows required variables
- ✅ **Type-safe**: Configuration is validated and typed in `services/config.ts`

## 📁 Files

### `.env` (Git-ignored)
Your actual environment variables. **Never commit this file!**

### `.env.example` (Committed)
Template showing required variables. Copy this to create your `.env`.

## 🛠️ Setup Instructions

### 1. Create your `.env` file

```bash
# Copy the example file
cp .env.example .env
```

### 2. Update the values

Edit `.env` and replace `YOUR_LOCAL_IP` with your actual local IP address:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.31.143:3000/api
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_ENV=development
```

### 3. Find your local IP

**Windows:**
```powershell
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

**macOS/Linux:**
```bash
ifconfig
# Look for "inet" under your active network interface
```

**Why local IP?**
- Expo Go on your phone needs to reach your development server
- `localhost` won't work because it refers to the phone, not your computer
- Use your computer's IP address on the same WiFi network

## 📋 Environment Variables

### `EXPO_PUBLIC_API_BASE_URL`
- **Required**: Yes
- **Description**: Base URL for the backend API
- **Development**: `http://YOUR_LOCAL_IP:3000/api`
- **Production**: `https://api.edumaths.com/api` (example)

### `EXPO_PUBLIC_API_TIMEOUT`
- **Required**: No (defaults to 30000)
- **Description**: API request timeout in milliseconds
- **Recommended**: `30000` (30 seconds)

### `EXPO_PUBLIC_ENV`
- **Required**: No (defaults to 'development')
- **Description**: Current environment
- **Values**: `development` | `staging` | `production`

## 💻 Usage in Code

### Import configuration

```typescript
import { API_BASE_URL, API_TIMEOUT, isDevelopment } from '@services/config';

console.log(API_BASE_URL); // http://192.168.31.143:3000/api
console.log(API_TIMEOUT);  // 30000
console.log(isDevelopment); // true
```

### Use API client

```typescript
import { apiClient } from '@services/api';

// Make authenticated request
const response = await apiClient.get('/exams/123/status');

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error);
}
```

### Set authentication token

```typescript
import { setAuthToken, clearAuthToken } from '@services/api';

// After student login
setAuthToken(studentJWT);

// On logout
clearAuthToken();
```

## 🔄 Different Environments

### Development (Local)
```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.31.143:3000/api
EXPO_PUBLIC_ENV=development
```

### Staging (Optional)
```env
EXPO_PUBLIC_API_BASE_URL=https://staging-api.edumaths.com/api
EXPO_PUBLIC_ENV=staging
```

### Production
```env
EXPO_PUBLIC_API_BASE_URL=https://api.edumaths.com/api
EXPO_PUBLIC_ENV=production
```

## 🚨 Troubleshooting

### "Unable to connect to server"
1. Check your `.env` file exists
2. Verify `EXPO_PUBLIC_API_BASE_URL` has correct IP
3. Ensure backend is running (`npm run dev` in backend folder)
4. Confirm phone and computer are on same WiFi network
5. Check firewall isn't blocking port 3000

### "EXPO_PUBLIC_API_BASE_URL is not defined"
1. Ensure `.env` file exists in `mobile/` directory
2. Restart the Expo dev server (`npm start`)
3. Clear cache: `npx expo start -c`

### Changes not reflecting
1. Stop the dev server (Ctrl+C)
2. Clear Expo cache: `npx expo start -c`
3. Restart the app on your phone

## 📚 References

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Backend API Documentation](../backend/API_DOCS.md)

## ✅ Checklist

Before starting development:
- [ ] `.env` file created
- [ ] Local IP address configured
- [ ] Backend server running
- [ ] Phone and computer on same WiFi
- [ ] App can connect to API

---
**Note**: Always use `EXPO_PUBLIC_` prefix for client-accessible variables in Expo!
