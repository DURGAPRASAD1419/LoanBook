<div align="center">

# 💼 LoanBook

**A mobile-first loan & borrower management app** — track borrowers, disbursements, due collections, and repayment history, wrapped in a glassy, animated 3D interface.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-0.165-000000?logo=three.js&logoColor=white)](https://threejs.org)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

</div>

---

## ✨ Overview

LoanBook is a two-part app for tracking informal or small-scale lending:

- **Frontend** — a React + Vite single-page app styled as a phone-width "app shell," with a full-screen **Three.js** background scene (floating coins, glass cards, and rings rendered with physically-based materials, real-time lighting, and cursor-driven parallax) that gives the whole UI a sense of real depth.
- **Backend** — an Express + MongoDB REST API handling auth, borrowers, loans, due collection, rescheduling, and CSV export.

## 🖼 Highlights

- 🔐 JWT-based auth (register/login)
- 👥 Borrower CRUD with per-borrower loan history
- 💰 Loan creation with configurable schedules, due tracking, and repayment recording
- 🔁 Due rescheduling and payment history
- 📊 Dashboard graphs (via Recharts) for collections and outstanding totals
- 📤 CSV export of loan data
- 🧊 Real-time animated 3D background (Three.js) — physically-based materials, environment reflections, and pointer parallax, fully decorative and click-through so it never blocks the UI
- 📱 Mobile-first layout that also looks great on desktop, with a frosted-glass "app card" effect

## 🗂 Project Structure

```
LoanBook1/
├── frontend/                 React + Vite client
│   ├── src/
│   │   ├── components/       Header, BottomNav, modals, ThreeScene (3D background), ProtectedRoute
│   │   ├── context/          AuthContext, DataContext
│   │   ├── pages/            Login, Signup, Dashboard, Collection, Loan, Borrowers, Graphs, Settings, ...
│   │   └── utils/            exportUtils (CSV export)
│   └── vite.config.js
└── backend/                  Express + MongoDB API
    ├── models/                User, Borrower, Loan (Mongoose schemas)
    ├── scripts/               One-off maintenance scripts
    ├── api/index.js           Serverless entry (Vercel)
    └── server.js               Express app & routes
```

## 🛠 Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, React Router 7, Vite 8, Tailwind CSS |
| 3D / Visuals | Three.js (PBR materials, PMREM environment lighting, custom shaders) |
| Charts     | Recharts |
| Icons      | lucide-react |
| Backend    | Node.js, Express |
| Database   | MongoDB (Mongoose) |
| Auth       | JWT + bcrypt |
| Deployment | Vercel (frontend + serverless backend) |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone & install

```bash
git clone <your-repo-url>
cd LoanBook1

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment variables

**`backend/.env`**
```env
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=a-long-random-secret
```

**`frontend/.env`**
```env
VITE_API_URL=http://localhost:5000
```

### 3. Run in development

```bash
# Terminal 1 — backend
cd backend
npm run dev

# Terminal 2 — frontend
cd frontend
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`). Resize your browser to phone width (or use dev tools device mode) for the closest match to the intended design — the 3D background scales to fill any viewport.

## 📡 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new user |
| `POST` | `/api/auth/login` | Authenticate and receive a JWT |
| `GET`  | `/api/borrowers` | List borrowers |
| `POST` | `/api/borrowers` | Add a borrower |
| `DELETE` | `/api/borrowers/:id` | Remove a borrower |
| `GET`  | `/api/loans` | List loans |
| `GET`  | `/api/loans/:loanId` | Get a single loan |
| `POST` | `/api/loans` | Create a loan |
| `PUT`  | `/api/loans/:loanId` | Update a loan |
| `DELETE` | `/api/loans/:loanId` | Delete a loan |
| `PUT`  | `/api/loans/:loanId/pay` | Record a payment against a due |
| `PUT`  | `/api/loans/:loanId/due/:dueNo/reschedule` | Reschedule a specific due date |
| `GET`  | `/api/loans/export` | Export loan data as CSV |
| `POST` | `/api/backup` | Trigger a data backup |

All routes except `auth/register` and `auth/login` require an `Authorization: Bearer <token>` header.

## ☁️ Deploying to Vercel

1. Push the repo to GitHub.
2. Import it into Vercel **twice** — once per project:
   - **Backend**: Root Directory → `backend`, Framework → *Other*.
   - **Frontend**: Root Directory → `frontend`, Framework → *Vite*, Build Command → `npm run build`, Output Directory → `dist`.
3. Set environment variables:
   - Backend: `MONGO_URI`, `JWT_SECRET`
   - Frontend: `VITE_API_URL` → your deployed backend URL
4. Redeploy both and confirm the frontend can reach the backend.

## 🧭 Roadmap Ideas

- [ ] SMS/email due-date reminders
- [ ] Multi-currency support
- [ ] Role-based access (admin vs. collector)
- [ ] PDF statement generation

## 📄 License

This project currently has no explicit license. Add one (e.g. MIT) before distributing publicly.
