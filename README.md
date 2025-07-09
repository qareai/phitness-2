# Stay Hard Reminder 💪

A fitness accountability app that helps users stick to their gym promises—or lose the bet they placed against themselves. Powered by location tracking, motivational calls, and wallet incentives.

---

## 🚀 Features

### Core Functionality

- **Location-based Check-ins:** Uses GPS to verify you're actually at the gym.
- **Bet System:** Put money on the line to stay motivated.
- **Streak Tracking:** Monitor your consistency with visual progress.
- **Smart Notifications:** Reminders and motivational messages escalate if you miss your check-in.
- **Penalty System:** Automatic deductions for missed workouts.
- **Shopping Credits:** Convert penalties into fitness gear credits.

### User Experience

- **Simple 3-Screen Flow:** Login → Setup → Dashboard.
- **Dark/Light Theme:** Modern, calming design with theme toggle.
- **Real-time Updates:** Live location tracking and status updates.
- **Mobile-First:** Responsive design optimized for mobile use.


### Core Systems

#### 🗺️ Location Tracking ([src/utils/locationTracker.js](src/utils/locationTracker.js))

- Geolocation API integration.
- Haversine formula for distance calculation.
- 10-meter geofencing for gym check-ins.
- Background location monitoring.

#### 🔔 Notification System ([src/utils/notificationManager.js](src/utils/notificationManager.js))

- Push notification API integration.
- Escalating reminder workflow.
- User response handling.
- Motivational call triggers.

#### ⚙️ Daily Workflow Engine ([src/utils/workflowEngine.js](src/utils/workflowEngine.js))

- Automated daily check-in monitoring.
- Penalty application system.
- Streak management.
- Session scheduling.

#### 💰 Wallet Management ([src/utils/walletManager.js](src/utils/walletManager.js))

- Bet amount tracking.
- Penalty calculations (10% deduction).
- Shopping credit conversion (20% of bet).
- Transaction history.

#### 🤖 AI Motivational Calls ([src/utils/retellAI.js](src/utils/retellAI.js))

- Retell AI integration for automated motivational phone calls.
- Call logging and analytics.
- Contextual motivational messaging based on user data.

#### 🎨 Theme System ([src/contexts/ThemeContext.jsx](src/contexts/ThemeContext.jsx))

- React Context for theme state.
- Dark/light mode toggle.
- Persistent theme preferences.
- Smooth transitions.

### Data Storage

- **localStorage** for user data persistence.
- **JSON-based** data structures.
- **Real-time updates** across components.

---

## 📋 Workflow Logic

### Daily Check-in Process

1. **Trigger Time:** Check starts at user's preferred workout time.
2. **Location Verification:** GPS confirms user is within 10m of gym.
3. **Success Path:**
   - Streak increment.
   - Session logged.
   - Success notification.
4. **Failure Path:**
   - 15min: Warning notification.
   - 30min: Motivational call trigger.
   - 45min: Final warning.
   - 60min: Penalty application.

### Penalty System

- **10% Deduction:** From current bet balance.
- **20% Shopping Credit:** Added to fitness gear fund.
- **Streak Reset:** Back to 0 days.
- **Transaction Log:** All changes recorded.

---

## 🧠 AI Integration

### Retell AI Call Agent

- **Automated Motivational Calls:** The app integrates with Retell AI to deliver automated motivational phone calls when users miss check-ins or need encouragement.
- **Contextual Messaging:** Calls are tailored based on user data, workout history, and current streak.
- **Call Logging:** All AI call interactions are logged for analytics and user review.

### Friendly AI Usage

- **Conversational Support:** Friendly AI is used to provide in-app chat support, answering user questions about features, troubleshooting, and fitness tips.
- **Onboarding Guidance:** During setup, Friendly AI offers step-by-step assistance to help users configure their profile, gym location, and preferences.
- **Motivational Messaging:** Friendly AI sends personalized motivational messages and reminders, adapting tone and content based on user engagement and progress.
- **Feedback Collection:** After key actions (like check-ins or missed sessions), Friendly AI prompts users for feedback to improve the app experience.

---

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd phitness

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🔮 Future Enhancements

### Planned Features

- **Google Maps Integration:** Real gym location database.
- **Retell AI Calls:** Actual motivational phone calls.
- **Social Features:** Friend challenges and leaderboards.
- **Fitness Tracking:** Integration with health apps.
- **Shopping Store:** Redeem credits for actual gear.
- **Advanced Analytics:** Detailed progress insights.

### Technical Improvements

- **Backend API:** Replace localStorage with proper database.
- **Push Notifications:** Service worker implementation.
- **Offline Support:** PWA capabilities.
- **Real-time Sync:** Multi-device synchronization.

---

## 🛠️ Development Notes

- Gym locations use NYC coordinates for demo.
- Notification system works with browser permissions.
- Location tracking uses actual GPS when available.
- Manual check-in available for testing.
- Location status checker for debugging.
- Transaction history for penalty verification.
- Lazy loading for components.
- Optimized re-renders with React hooks.
- Efficient localStorage operations.

---

## 📄 License

This project is for demonstration purposes. All rights reserved.

---

**Stay Hard. Stay Committed. No Excuses.** 💪