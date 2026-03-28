# 🔐 LifeDoc

> **The ultimate Personal Life-Document & Deadline Guardian System**

LifeDoc solves a critical real-world problem: **People forget where their important documents are and miss crucial expiry or renewal deadlines — resulting in financial, legal, and emotional stress.** 

LifeDoc acts as a highly secure digital vault, keeping your family's most important documents meticulously organized and proactively monitoring them for upcoming expirations to grant you total peace of mind.

---

## ✨ Key Features

- **Secure Digital Vault**: Safely store, search, and categorize all your critical documents in one centralized ecosystem.
- **Expiry Radar & Proactive Alerts**: Advanced background chron jobs autonomously monitor document expiration dates and dispatch Smart Alerts at 30, 14, 7, and 1 days prior to deadlines. Never miss a renewal again.
- **Emergency Family Access**: Securely grant vault access to family members. Features a robust approval workflow mapping structured relational states (Pending, Approved, Revoked).
- **Comprehensive Admin Dashboard**: Complete administrative oversight including real-time storage metrics, active vault tallies, document moderation, and instant user access controls.
- **Stunning UI Architecture**: Built with a modern Glassmorphism design system powered by Tailwind CSS. Features high-performance, scroll-driven hero animations engineered using GSAP and Framer Motion.

---

## 🚀 Getting Started

### Prerequisites
Before running this project, ensure you have the following installed on your machine:
1. **Node.js**: Download from [nodejs.org](https://nodejs.org/).
2. **PostgreSQL**: Download and configure from [postgresql.org](https://www.postgresql.org/download/).

### Environment Setup

1. **Database Configuration**
   - Open your PostgreSQL command line tool (`psql`) or a graphical client (like pgAdmin).
   - Create a new, empty PostgreSQL database for the project (e.g., `lifedoc`).
   
2. **Environment Variables**
   - In the root of this project folder, create a new file named `.env`.
   - Add the following variables to `.env` (adjusting the database URI to match your local setup):

   ```env
   # Format: postgres://username:password@localhost:5432/database_name
   DATABASE_URL=postgres://postgres:your_password@localhost:5432/lifedoc
   
   # Secret used for signing cryptographically secure JWTs
   JWT_SECRET=super_secret_jwt_key_12345
   
   # API Port Configuration
   PORT=5000
   ```

### Installation

Navigate to the root directory of this project in your terminal and install the required Node dependencies:
```bash
npm install
```

---

## 🛠️ Running the Application

This project utilizes a highly decoupled architecture, requiring both the Node.js API and the React Client node to be served. For convenience, the `package.json` includes a concurrent script.

To launch the entire stack simultaneously, execute:

```bash
npm run dev
```

*This command automatically boots the Express backend on Port 5000 and serves the React frontend Application on Port 3000.*

### Accessing the Platform
Once the startup sequence completes, open your web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 📁 Architecture Highlights

### Backend Ecosystem
- **Core Runtime**: Node.js & Express.js
- **Database**: PostgreSQL (interfaced via `pg`) with automated schema migrations.
- **Security Checksums**: JWT for robust route authentication and `bcryptjs` for strict password hashing.
- **File Management**: `multer` handling secure multipart-form data.

### Frontend Ecosystem
- **Framework**: React 18 
- **Styling**: Tailwind CSS
- **Interactivity**: Framer Motion & GSAP for timeline sequencing.
- **API Connectivity**: Axiomatic client request interceptors automatically injecting JWT signatures natively across all internal HTTP requests.

---

## 🔒 Security Posture

- **Cryptographic Hashing**: Passwords secured via bcrypt.
- **Stateless Sessions**: JWT token-based authentication.
- **Input Sanitization**: File upload validation pipelines explicitly rejecting malicious configurations.
- **SQL Protection**: Forced Parameterized Queries across all native `pg` transactions to inherently block SQL injection vectors.
- **Access Control**: Strict `ProtectedRoute` wrapper hierarchy denying render trees to unauthorized users.

---

## 📄 License & Origin
MIT Licensed. Designed and meticulously structured to handle massive scalability, real-world constraints, and the highest standards of production security for life's most precious documents.
