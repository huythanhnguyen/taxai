# 🇻🇳 Vietnamese Tax Filing PWA Platform

A comprehensive Progressive Web Application for Vietnamese tax filing, built with React and Node.js.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation & Running

1. **Clone the repository:**
```bash
git clone git@github.com:YOUR_USERNAME/REPO_NAME.git
cd REPO_NAME
```

2. **Install dependencies:**
```bash
npm run install:all
```

3. **Start development servers:**
```bash
# Option 1: Use startup script (recommended)
./start.sh

# Option 2: Use npm scripts
npm run dev

# Option 3: Start individually
npm run dev:backend  # Backend on port 3001
npm run dev:frontend # Frontend on port 3000
```

4. **Access the application:**
- 🌐 Frontend: http://localhost:3000
- 📊 Backend API: http://localhost:3001
- 🔍 Health Check: http://localhost:3001/health

## 📁 Project Structure

```
tax-filing-pwa/
├── frontend/          # React TypeScript frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── contexts/      # React contexts
│   │   └── types/         # TypeScript types
│   └── package.json
├── backend/           # Node.js Express backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── simple-server.js   # Simple development server
│   └── package.json
├── docs/              # Documentation
├── start.sh           # Quick start script
└── package.json       # Root package.json
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend
- `npm run start` - Start production servers
- `npm run build` - Build both applications
- `npm run install:all` - Install all dependencies

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests

### Backend
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript
- `npm run start` - Start production server

## 🔧 Configuration

### Environment Variables

Create `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tax_filing_db
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

## 🏗️ Architecture

### Frontend Stack
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Material-UI** - Component library
- **React Router** - Navigation
- **Axios** - HTTP client

### Backend Stack
- **Node.js** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

## 📋 Features

### Tax Form Management
- ✅ Create and edit tax forms
- ✅ Multiple form types (TNCN, VAT, etc.)
- ✅ Form validation and submission
- ✅ Draft saving and auto-save

### User Management
- ✅ User registration and authentication
- ✅ Role-based access control
- ✅ Profile management

### Security
- ✅ JWT-based authentication
- ✅ Password encryption
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Input validation

## 🚦 Development Status

- ✅ Project setup and configuration
- ✅ Basic frontend components
- ✅ Backend API structure
- ✅ Authentication system
- ⏳ Database integration
- ⏳ Tax form processing
- ⏳ File upload functionality
- ⏳ PWA features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Port already in use:**
```bash
# Kill processes on ports 3000 and 3001
npx kill-port 3000 3001
```

2. **Module not found errors:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm run install:all
```

3. **TypeScript compilation errors:**
```bash
# Use simple server for development
cd backend && node simple-server.js
```

### Getting Help

- 📧 Create an issue on GitHub
- 📖 Check the [documentation](./docs/)
- 🔍 Search existing issues

## 🙏 Acknowledgments

- Vietnamese General Department of Taxation for tax form specifications
- React and Node.js communities
- All contributors and testers

---

Made with ❤️ for Vietnamese taxpayers 