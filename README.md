# 🔐 LifeDoc - Personal Life-Document + Deadline Guardian System

LifeDoc solves ONE huge real problem:

**People forget where their important documents are, and forget their expiry/renewal deadlines — and they suffer financially, legally and emotionally.**

## 🎯 Problem Solved

| Real Life Problem | How LifeDoc Solves It |
|-------------------|----------------------|
| Lost documents | Secure digital vault |
| Missed deadlines | Smart reminder system |
| Family panic in emergencies | Emergency family access |
| Poor organization | Category based storage |
| Forgetting expiry dates | Auto alerts |
| Paying late fees | Renewal reminders |

## 🧩 Core Modules

### 1. Secure Digital Vault
Upload & store:
- Aadhaar
- PAN
- Driving License
- Passport
- Certificates
- Medical reports
- Insurance policies
- Property papers
- Bank documents

### 2. Smart Deadline Manager
Set expiry/renewal dates:
- Insurance renewal
- License expiry
- Exam forms
- Fee payments
- Passport expiry
- Medicine refills

LifeDoc automatically reminds you.

### 3. Emergency Family Access
User selects trusted family member → they can access documents in emergency.

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lifedoc
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   This installs dependencies for both backend and frontend.

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   UPLOAD_DIR=./uploads
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```
   This starts both the backend server (port 5000) and frontend React app (port 3000).

   Or start them separately:
   ```bash
   # Backend only
   npm run server

   # Frontend only (in another terminal)
   npm run client
   ```

## 📁 Project Structure

```
lifedoc/
├── server/                 # Backend Express.js server
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth middleware
│   ├── routes/            # API routes
│   │   ├── auth.js       # Authentication routes
│   │   ├── documents.js  # Document management routes
│   │   ├── deadlines.js  # Deadline management routes
│   │   └── family.js     # Family access routes
│   ├── services/          # Background services
│   │   └── reminderService.js  # Deadline reminder scheduler
│   └── index.js          # Server entry point
├── client/                # Frontend React app
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── components/   # React components
│   │   ├── context/      # React context (Auth)
│   │   └── App.tsx       # Main app component
│   └── public/
├── uploads/               # Uploaded documents storage
└── lifedoc.db            # SQLite database (created automatically)
```

## 🔑 Features

### Authentication
- User registration and login
- JWT-based authentication
- Secure password hashing with bcrypt

### Document Management
- Upload documents (images, PDFs, Word docs)
- Categorize documents
- View and download documents
- Delete documents
- Filter by category

### Deadline Management
- Create deadlines with custom reminder days
- Link deadlines to documents
- Visual urgency indicators (overdue, urgent, soon)
- Mark deadlines as complete
- Automatic daily reminder checks

### Emergency Family Access
- Generate secure access codes for family members
- Activate/deactivate access
- Share access codes securely
- Family members can access documents using the code

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **SQLite** database
- **JWT** for authentication
- **Multer** for file uploads
- **node-cron** for scheduled reminders
- **bcryptjs** for password hashing

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API calls
- Modern CSS with responsive design

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get all documents
- `GET /api/documents/:id` - Get single document
- `DELETE /api/documents/:id` - Delete document

### Deadlines
- `POST /api/deadlines` - Create deadline
- `GET /api/deadlines` - Get all deadlines
- `GET /api/deadlines/:id` - Get single deadline
- `PUT /api/deadlines/:id` - Update deadline
- `DELETE /api/deadlines/:id` - Delete deadline

### Family Access
- `POST /api/family/access` - Create family access
- `GET /api/family/access` - Get all family accesses
- `PUT /api/family/access/:id` - Update family access
- `DELETE /api/family/access/:id` - Delete family access
- `GET /api/family/emergency/:access_code` - Emergency document access

## 🔔 Reminder System

The reminder service runs daily at 9 AM and checks for upcoming deadlines. It sends reminders based on the `reminder_days` setting for each deadline. Currently, reminders are logged to the console. In production, you can extend this to send emails or SMS notifications.

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Secure file upload validation
- Access control for all endpoints
- SQL injection protection (parameterized queries)
- File type validation

## 📝 Usage Examples

### Creating a Deadline
1. Go to the "Deadlines" tab
2. Fill in the deadline form:
   - Title: "Insurance Renewal"
   - Deadline Date: Select future date
   - Reminder Days: 30 (remind 30 days before)
   - Category: Insurance Renewal
   - Optionally link to a document
3. Click "Create Deadline"

### Adding Family Access
1. Go to the "Family Access" tab
2. Click "Add Family Member"
3. Enter family member's name and email
4. Click "Create Access Code"
5. Share the generated access code securely with your family member

### Emergency Access
Family members can access documents by visiting:
```
http://localhost:5000/api/family/emergency/{access_code}
```

## 🚧 Future Enhancements

- Email/SMS notifications for reminders
- Document encryption at rest
- Cloud storage integration (AWS S3, Google Drive)
- Mobile app (React Native)
- Document OCR and text extraction
- Advanced search functionality
- Document sharing with expiration
- Multi-factor authentication
- Audit logs

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## ⚠️ Important Notes

- This is a development version. For production use:
  - Change the JWT_SECRET to a strong random string
  - Use a production database (PostgreSQL, MySQL)
  - Set up proper file storage (AWS S3, etc.)
  - Implement email/SMS notification service
  - Add rate limiting and security headers
  - Use HTTPS
  - Set up proper backup and recovery

## 🐛 Troubleshooting

### Database errors
- Make sure SQLite is installed
- Check file permissions for database creation

### File upload errors
- Ensure `uploads/` directory exists and is writable
- Check file size limits (default: 10MB)

### Port conflicts
- Change PORT in `.env` if 5000 is already in use
- React app runs on port 3000 by default

## 📞 Support

For issues and questions, please open an issue on GitHub.

---

**Built with ❤️ to help people never lose important documents or miss critical deadlines again.**
