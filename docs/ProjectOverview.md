# SmartGoals Project Overview

## 📋 Project Summary

SmartGoals is a comprehensive SMART goals management application that helps users create, track, and achieve their goals through AI-powered breakdown, progress tracking, and detailed analytics.

**Tech Stack:**
- **Frontend**: React 18 + TypeScript + Tailwind CSS v4 + Vite
- **Backend**: FastAPI + Python 3.11+ + Pydantic
- **Database**: MongoDB with Motor (async driver)
- **Authentication**: JWT tokens
- **AI Integration**: DeepSeek API for goal breakdown
- **Notifications**: Web Push + Email (SMTP)
- **Scheduling**: APScheduler for background jobs

## 🏗️ Architecture Overview

### Monorepo Structure
```
/
├── client/              # React frontend (Vite root)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route components
│   │   ├── contexts/    # React contexts (Auth, Language)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── stores/      # Zustand store and selectors
│   │   ├── services/    # Data services (Goal, Stats, Progress)
│   │   └── lib/         # Utilities, API client, schemas
│   └── public/
├── api/                 # FastAPI backend
│   ├── routers/         # API route handlers
│   ├── services/        # Business logic services
│   ├── models.py        # Pydantic models
│   ├── db.py           # MongoDB connection
│   ├── config.py       # Environment configuration
│   └── main.py         # FastAPI app entry point
├── docs/               # Documentation
└── .venv/              # Python virtual environment
```

### Database Schema (MongoDB Collections)

#### Core Collections
- **`users`** - User accounts and profiles
- **`user_settings`** - User preferences and notification settings
- **`goals`** - SMART goals with status tracking
- **`weekly_goals`** - Goal breakdown into weekly objectives
- **`daily_tasks`** - Individual tasks within weekly goals
- **`activities`** - User activity log for tracking actions
- **`push_subscriptions`** - Web push notification subscriptions

#### Indexes
- `users.email` (unique)
- `goals.userId`
- `weekly_goals.goalId`
- `daily_tasks.weeklyGoalId`
- `activities.userId + createdAt`
- `push_subscriptions.userId + endpoint` (unique)

## ✅ Implemented Features

### 🔐 Authentication & User Management
- **User Registration/Login** - JWT-based authentication
- **Profile Management** - Update user information and bio
- **Settings Management** - Notification preferences, themes, AI settings
- **Password Security** - Bcrypt hashing with salt

### 🎯 Goal Management
- **SMART Goal Creation** - Structured goal creation with all SMART criteria
- **Goal CRUD Operations** - Create, read, update, delete goals
- **Goal Status Tracking** - Active, completed, paused states
- **Draft Goal Saving** - Save incomplete goals as drafts
- **Goal Categories** - Health, Work, Family, Personal

### 🤖 AI-Powered Features
- **Goal Breakdown** - AI generates weekly goals and daily tasks
- **Task Generation** - Automatic task creation with priorities and time estimates
- **Goal Regeneration** - Re-generate breakdown with different approaches
- **DeepSeek Integration** - Uses DeepSeek API for intelligent suggestions

### 📊 Analytics & Progress Tracking
- **Progress Statistics** - Goal completion rates, task counts, streaks
- **Analytics Dashboard** - Comprehensive performance metrics
- **Category Performance** - Success rates by goal category
- **Productivity Patterns** - Performance analysis by day of week
- **Streak Tracking** - Current and longest completion streaks
- **Monthly Comparisons** - Progress trends over time

### 📱 Task Management
- **Task Completion** - Mark tasks as complete/incomplete
- **Task Updates** - Modify task details and priorities
- **Progress Calculation** - Automatic progress updates based on task completion
- **Weekly Planning** - Organized task structure by weeks

### 🔔 Notifications
- **Web Push Notifications** - Browser-based notifications
- **Email Notifications** - SMTP-based email alerts
- **Daily Reminders** - Scheduled goal reminders
- **Weekly Digests** - Summary emails for progress updates
- **Activity Logging** - Track all user actions and achievements

### 🌐 Internationalization
- **Multi-language Support** - English and Chinese translations
- **Language Context** - React context for language switching
- **Localized Content** - All UI text supports translation

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info

### User Management
- `GET /api/user/profile` - Get user profile
- `PATCH /api/user/profile` - Update user profile
- `GET /api/user/settings` - Get user settings
- `PATCH /api/user/settings` - Update user settings

### Goals
- `POST /api/goals` - Create goal (supports `?draft=true`)
- `GET /api/goals` - List user goals
- `GET /api/goals/detailed` - List goals with breakdown
- `GET /api/goals/{id}` - Get specific goal with breakdown
- `PATCH /api/goals/{id}` - Update goal
- `DELETE /api/goals/{id}` - Delete goal

### Tasks
- `PATCH /api/tasks/{id}` - Update task (completion, details)

### Analytics
- `GET /api/analytics/stats` - Basic analytics statistics
- `GET /api/progress/stats` - Progress tracking statistics
- `GET /api/analytics/summary` - Comprehensive analytics data
- `GET /api/analytics/categories` - Goal category performance
- `GET /api/analytics/patterns` - Productivity patterns

### AI Integration
- `POST /api/ai/breakdown` - Generate goal breakdown
- `POST /api/ai/regenerate` - Regenerate goal breakdown

### Activities
- `GET /api/activities` - Get user activity log

### Notifications
- `GET /api/notifications/vapid-public-key` - Get VAPID public key
- `POST /api/notifications/subscribe` - Subscribe to push notifications
- `POST /api/notifications/unsubscribe` - Unsubscribe from notifications
- `POST /api/notifications/push/test` - Test push notification
- `POST /api/notifications/email/test` - Test email notification

## 🔧 Development Setup

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.11
- MongoDB (local or remote)

### Environment Configuration
Create `.env` file in project root:
```env
# Core
ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/smartgoals
MONGODB_DB=smartgoals
JWT_SECRET=your-secret-key
JWT_EXPIRES_MIN=10080
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

# AI (optional)
DEEPSEEK_API_KEY=your-deepseek-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com

# Email (optional)
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_USE_TLS=true
EMAIL_FROM=

# Web Push (optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@example.com
```

### Installation & Running
```bash
# Install dependencies
npm install
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r api/requirements.txt

# Development (runs both frontend and backend)
npm run dev

# Individual services
npm run api:dev      # FastAPI on :8000
npm run client:dev   # Vite on :5173

# Production build
npm run build
npm run api:start
```

## 📱 Frontend Architecture

### Key Components
- **Navigation** - Main app navigation with responsive design
- **Goal Wizard** - Multi-step goal creation form
- **AI Breakdown** - Goal breakdown interface with AI integration
- **Analytics Dashboard** - Comprehensive analytics visualization
- **Progress Tracking** - Progress visualization and task management

### Data Flow Architecture
- **Store + Services Pattern** - Uniform data fetching across all pages
- **Zustand Store** - Central state management with TypeScript support
- **Service Layer** - Business logic abstraction with automatic store updates
- **Selectors** - Optimized data access with selective subscriptions
- **Error Handling** - Consistent error handling with fallback data

### State Management
- **Zustand Store** - Centralized state management with devtools and persistence
- **Service Layer** - GoalService, StatsService, ProgressService for data operations
- **React Query** - Limited to auth operations and settings (one-off operations)
- **React Context** - Authentication and language state
- **Local Storage** - JWT token persistence and UI preferences

### UI Framework
- **Tailwind CSS v4** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animations and transitions

## 🔒 Security Features

### Authentication
- JWT tokens with configurable expiration
- Secure password hashing with bcrypt
- Token-based API authentication
- Protected routes and components

### Data Validation
- Pydantic models for API validation
- Zod schemas for frontend validation
- Input sanitization and type checking

### CORS Configuration
- Configurable allowed origins
- Credential support for authenticated requests

## 🚀 Deployment

### Production Build
```bash
npm run build  # Builds client to dist/public
```

### Environment Setup
- Configure production MongoDB URI
- Set secure JWT secret
- Configure SMTP for email notifications
- Set up VAPID keys for push notifications

### Recommended Architecture
- Reverse proxy (nginx) serving static files
- FastAPI backend on separate port
- MongoDB with proper indexing
- SSL/TLS certificates for HTTPS

## 📈 Performance Considerations

### Database
- Proper indexing on frequently queried fields
- Aggregation pipelines for analytics calculations
- Connection pooling with Motor

### Frontend
- Code splitting with Vite
- Zustand store with selective subscriptions for optimal re-renders
- Service layer caching and batch data fetching
- Lazy loading for route components
- Optimized bundle size

### Backend
- Async/await throughout for non-blocking operations
- Background job scheduling for notifications
- Efficient MongoDB queries with projections

## 🧪 Testing Strategy

### Current Status
- Basic error handling and validation
- API endpoint structure ready for testing
- Frontend components with proper error boundaries

### Recommended Testing
- Unit tests for utility functions
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for analytics calculations

## 🔮 Future Enhancements

### Potential Features
- **Achievement System** - Gamification with badges and rewards
- **Team Goals** - Collaborative goal setting
- **Goal Templates** - Pre-built goal structures
- **Advanced Analytics** - Machine learning insights
- **Mobile App** - React Native or PWA
- **Integration APIs** - Connect with external tools
- **Goal Sharing** - Social features for motivation

### Technical Improvements
- **Caching Layer** - Redis for improved performance
- **Real-time Updates** - WebSocket connections
- **Advanced Search** - Full-text search capabilities
- **Data Export** - CSV/PDF export functionality
- **Backup System** - Automated data backups

## 📚 Documentation

- **README.md** - Quick start and basic setup
- **ProjectOverview.md** - This comprehensive overview
- **reference.html** - SMART goals reference guide
- **API Documentation** - Available at `/docs` when running

## 🤝 Contributing

### Code Style
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Consistent naming conventions
- Comprehensive error handling

### Development Workflow
1. Create feature branch
2. Implement changes with proper typing
3. Test functionality thoroughly
4. Update documentation as needed
5. Submit pull request with clear description

---

**Last Updated**: August 28, 2025
**Version**: 1.1.0 - Store + Services Architecture
**Maintainer**: Development Team
