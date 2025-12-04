---
name: testflight
description: TestFlight and App Store distribution guide. Use when preparing app for TestFlight, creating production builds, or submitting to App Store Connect.
---

# TestFlight & App Store Distribution

## Prerequisites

- Apple Developer Program membership ($99/year)
- Xcode installed
- EAS CLI installed: `npm install -g eas-cli`
- Expo account: `eas login`

## Build Profiles (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      }
    }
  }
}
```

## Environment Variables for Production

```bash
# mobile/.env.production
EXPO_PUBLIC_SIGNALING_SERVER_URL=https://webrtc-signaling-xxxx.onrender.com
```

## Build Commands

```bash
cd mobile

# Configure EAS (first time)
eas build:configure

# Development build (for testing)
eas build --platform ios --profile development

# Preview build (internal distribution)
eas build --platform ios --profile preview

# Production build (App Store)
eas build --platform ios --profile production

# Submit to App Store Connect
eas submit --platform ios --latest
```

## TestFlight Distribution Steps

1. **Create Production Build**
   ```bash
   eas build --platform ios --profile production
   ```

2. **Submit to App Store Connect**
   ```bash
   eas submit --platform ios
   ```

3. **Configure in App Store Connect**
   - Go to https://appstoreconnect.apple.com
   - Select app → TestFlight tab
   - Wait for build processing (5-30 minutes)
   - Add test information if required

4. **Add Testers**
   - Internal testers: Up to 100 (Apple Developer team members)
   - External testers: Up to 10,000 (requires brief review)

5. **Tester Installation**
   - Testers receive email invitation
   - Install TestFlight app from App Store
   - Open invitation link → Install app

## App Store Submission Checklist

- [ ] App icons (all required sizes)
- [ ] Screenshots for required device sizes
- [ ] App description and keywords
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Age rating questionnaire
- [ ] Export compliance information
- [ ] Production environment variables set

## Common Issues

| Issue | Solution |
|-------|----------|
| Build fails with signing error | Check Apple Developer certificates in Xcode |
| "Missing compliance" | Complete export compliance in App Store Connect |
| Build stuck in processing | Wait up to 30 minutes, or rebuild |
| TestFlight invite not received | Check spam folder, verify email address |

## Important Notes

- TestFlight builds expire after 90 days
- Each new build requires incrementing version or build number
- External testers require Apple review (usually 24-48 hours)
- Keep production signaling server running on Render
