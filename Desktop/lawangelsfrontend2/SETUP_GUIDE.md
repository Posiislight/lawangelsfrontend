# Law Angels Mock Exam Platform - Setup & Usage Guide

## 🎯 What's Been Implemented

### Backend (Django REST API)
✅ **Authentication System**
- User registration endpoint
- User login endpoint (session-based)
- User logout endpoint
- Current user info endpoint
- Session-based authentication

✅ **Quiz Management**
- Exam model with timing configuration
- Question model with difficulty levels
- Multiple choice options (A-E)
- Exam attempt tracking
- Answer submission with automatic correctness detection
- Score calculation

✅ **API Endpoints**
```
POST   /api/auth/register/           - Register new user
POST   /api/auth/login/              - Login user
POST   /api/auth/logout/             - Logout user
GET    /api/auth/me/                 - Get current user info

GET    /api/exams/                   - List all exams
GET    /api/exams/{id}/              - Get exam with questions
GET    /api/exams/{id}/questions/    - Get questions for exam
GET    /api/exams/config/            - Get timing configuration

GET    /api/questions/               - List questions
GET    /api/questions/{id}/          - Get question with options

POST   /api/exam-attempts/           - Start exam attempt
GET    /api/exam-attempts/           - List user's attempts
GET    /api/exam-attempts/{id}/      - Get attempt details
PATCH  /api/exam-attempts/{id}/      - End exam attempt
POST   /api/exam-attempts/{id}/submit-answer/  - Submit answer
GET    /api/exam-attempts/{id}/review/         - Get exam review
```

### Frontend
✅ **Authentication Pages**
- Login page with form validation
- Register page with password confirmation
- Protected routes (requires login to access mock exam)
- Auth context for state management
- Demo credentials provided on login page

✅ **Mock Exam Component**
- Fetches questions from backend
- Real-time answer submission
- Timer (60 minutes)
- Speed reader mode (70-second auto-advance)
- Answer feedback (correct/incorrect with explanations)
- Progress tracking
- Question navigation

✅ **UI/UX Features**
- Responsive design
- Color-coded feedback (green for correct, red for incorrect)
- Progress bar
- Loading states
- Error handling

---

## 🚀 How to Get Started

### 1. Backend Setup

**Prerequisites:**
- Python 3.8+
- Virtual environment installed

**Initial Setup:**
```bash
cd backend
pip install -r requirements.txt
cd lawangels
python manage.py migrate
python manage.py create_test_user
python manage.py populate_questions
python manage.py runserver
```

**Server will run at:** http://localhost:8000

### 2. Frontend Setup

**Prerequisites:**
- Node.js 16+
- npm or yarn

**Initial Setup:**
```bash
cd lawangels
npm install
npm run dev
```

**Server will run at:** http://localhost:5174 (or next available port)

---

## 📝 Demo Credentials

**Username:** `testuser`
**Password:** `testpass123`

Use these to test the login functionality without creating a new account.

---

## 🧪 Testing the System

### Test Flow:
1. Go to http://localhost:5174/login
2. Enter demo credentials:
   - Username: `testuser`
   - Password: `testpass123`
3. Click "Sign In" - you'll be redirected to `/mock-exam`
4. The exam will load 3 sample questions from the backend
5. Select answers and see real-time feedback

### What to Expect:
- ⏱️ Timer counting down from 60 minutes
- 📝 Questions load from backend database
- ✅ Correct answers show green with explanation
- ❌ Incorrect answers show red with explanation
- 🚀 Speed reader mode can be toggled (auto-advances after 70 seconds)
- 📊 Progress bar shows how many questions you've answered

---

## 🔧 Key Features

### 1. Session-Based Authentication
- Uses Django's built-in session framework
- Cookies are automatically sent with requests (credentials: 'include')
- Session expires after inactivity

### 2. Backend Answer Validation
- Answers are stored in database
- Correctness is determined by comparing to `Question.correct_answer`
- Scores are calculated when exam ends

### 3. Protected Routes
- Any attempt to access `/mock-exam` without login redirects to `/login`
- Auth context checks user status on app load
- Failed authentication shows error messages

---

## 📚 Database Schema

### Models:
- **User** - Django built-in (username, email, password)
- **Exam** - Exam configurations
- **Question** - Individual questions with explanations
- **QuestionOption** - Multiple choice options (A-E)
- **ExamAttempt** - User's attempt at an exam
- **QuestionAnswer** - Individual answers for tracking
- **ExamTimingConfig** - Global timing defaults

---

## 🛠️ Customization

### Add More Questions:
Edit `backend/lawangels/quiz/management/commands/populate_questions.py` and add more question objects.

### Change Exam Duration:
Update the duration in the `populate_questions.py` command or via Django admin.

### Modify Styling:
All components use Tailwind CSS. Colors are standardized:
- Primary: `#0F172B` (dark navy)
- Secondary: `#E17100` (orange)
- Accent: `#FE9A00` (light orange)

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port
# Windows (PowerShell):
Get-Process -Name "python" | Stop-Process -Force

# Or change port in Django:
python manage.py runserver 8001
```

### CORS Errors
The backend is configured to allow:
- http://localhost:3000
- http://localhost:5173
- http://localhost:5174
- http://127.0.0.1:3000
- http://127.0.0.1:5173

If using different ports, update `CORS_ALLOWED_ORIGINS` in `lawangels/settings.py`.

### Login Not Working
1. Check if test user was created: `python manage.py create_test_user`
2. Verify credentials are correct
3. Check backend is running on http://localhost:8000
4. Check browser console for errors

---

## 📦 What's Next?

**Recommended Enhancements:**
1. Add more questions via management command
2. Implement email verification for registration
3. Add password reset functionality
4. Create exam results/review page
5. Add user profile page
6. Implement different exam types
7. Add analytics/progress tracking
8. Deploy to production (Heroku, AWS, etc.)

---

## 📞 Support

For issues or questions:
1. Check the browser console (F12) for frontend errors
2. Check Django logs for backend errors
3. Verify both servers are running
4. Check CORS configuration if API calls fail

---

## ✨ Key Technologies

**Backend:**
- Django 5.2.8
- Django REST Framework 3.14.0
- Django CORS Headers 4.3.1
- SQLite3 Database

**Frontend:**
- React 19.1.0
- TypeScript 5.8.3
- Vite 6.3.5
- Tailwind CSS 3.4.10
- React Router v6

---

Good luck with your mock exams! 🎓
