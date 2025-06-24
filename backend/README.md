# 🎬 Movie Recommendation Backend API

A robust, secure, and scalable backend API for movie recommendations with advanced authentication, user management, and AI-powered recommendation system.

## 🚀 Features

### 🔐 **Advanced Authentication & Security**
- **JWT-based authentication** with configurable expiration
- **Role-based access control** (User, Admin, Moderator)
- **Account lockout protection** after failed login attempts
- **Email verification** system
- **Password reset** functionality
- **Rate limiting** on all endpoints
- **Input validation & sanitization**
- **Helmet.js** security headers
- **CORS** protection

### 👥 **User Management**
- **Comprehensive user profiles** with preferences
- **Admin dashboard** with user statistics
- **Account activation/deactivation**
- **User role management**
- **Profile customization**
- **Activity logging**

### 🧠 **AI-Powered Recommendations**
- **Machine learning** based movie recommendations
- **Multi-language support** (Hindi, Telugu, Tamil, etc.)
- **Year-based filtering**
- **Customizable recommendation count**
- **Python integration** with scikit-learn

### 📊 **Monitoring & Analytics**
- **Request logging** with Morgan
- **Activity tracking**
- **Health check endpoints**
- **Error handling** with detailed error codes
- **Performance monitoring**

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Python** - AI/ML processing
- **scikit-learn** - Machine learning
- **pandas** - Data processing
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **helmet** - Security headers
- **morgan** - HTTP request logging

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- MongoDB

### Setup

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up Python virtual environment:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Environment variables** (create `.env` file):
```env
NODE_ENV=development
PORT=5001
JWT_SECRET=your-super-secret-jwt-key
MONGODB_URI=your-mongodb-connection-string
```

4. **Start the server:**
```bash
node src/app.js
```

## 🔌 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| GET | `/verify-email/:token` | Verify email | No |
| POST | `/forgot-password` | Request password reset | No |
| POST | `/reset-password/:token` | Reset password | No |
| GET | `/me` | Get current user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| PUT | `/preferences` | Update user preferences | Yes |
| PUT | `/change-password` | Change password | Yes |
| POST | `/logout` | Logout | Yes |
| GET | `/users` | Get all users (admin) | Yes (Admin) |
| PUT | `/users/:userId` | Update user (admin) | Yes (Admin) |

### User Management (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:userId` | Get user profile | Yes |
| PUT | `/:userId` | Update user profile | Yes |
| PUT | `/:userId/preferences` | Update user preferences | Yes |
| DELETE | `/:userId` | Delete user account | Yes |
| GET | `/` | Get all users (admin) | Yes (Admin) |
| PATCH | `/:userId/role` | Update user role (admin) | Yes (Admin) |
| PATCH | `/:userId/status` | Toggle user status (admin) | Yes (Admin) |
| GET | `/stats/overview` | User statistics (admin) | Yes (Admin) |

### Recommendations (`/api/recommendations`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/` | Get movie recommendations | Yes |
| GET | `/history` | Get recommendation history | Yes |
| GET | `/languages` | Get available languages | Yes |
| GET | `/genres` | Get available genres | Yes |
| GET | `/health` | Health check | No |

### Health Checks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/healthcheck` | Basic health check |
| GET | `/api/health` | Detailed health status |

## 🔐 Authentication

### JWT Token Format
```json
{
  "Authorization": "Bearer <your-jwt-token>"
}
```

### User Roles
- **user**: Regular user with basic access
- **moderator**: Can manage content and users
- **admin**: Full system access

## 📝 Request Examples

### Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123"
  }'
```

### Get Movie Recommendations
```bash
curl -X POST http://localhost:5001/api/recommendations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "movieName": "RRR",
    "movieLanguage": "Telugu",
    "yearGap": "0-5",
    "k": 10
  }'
```

### Update Profile
```bash
curl -X PUT http://localhost:5001/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "John Smith",
    "bio": "Movie enthusiast",
    "location": "New York"
  }'
```

## 🛡️ Security Features

### Rate Limiting
- **Auth endpoints**: 5 requests per 15 minutes
- **API endpoints**: 100 requests per 15 minutes

### Input Validation
- **Email validation** with regex patterns
- **Password strength** requirements
- **Input sanitization** to prevent XSS
- **MongoDB injection** protection

### Account Protection
- **Account lockout** after 5 failed login attempts
- **Password hashing** with bcrypt
- **JWT token expiration**
- **CORS protection**

## 📊 Error Handling

All errors follow a consistent format:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional details (optional)"
}
```

### Common Error Codes
- `VALIDATION_ERROR` - Input validation failed
- `AUTH_REQUIRED` - Authentication required
- `INSUFFICIENT_PERMISSIONS` - Role-based access denied
- `USER_NOT_FOUND` - User not found
- `TOKEN_EXPIRED` - JWT token expired
- `ACCOUNT_LOCKED` - Account temporarily locked

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development|production
PORT=5001
JWT_SECRET=your-secret-key
MONGODB_URI=mongodb://localhost:27017/movie-recommendations
```

### Python Dependencies
```
Flask==2.3.3
pandas==2.0.3
numpy==1.24.3
scikit-learn==1.3.0
```

## 🚀 Deployment

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure secure JWT secret
- [ ] Set up MongoDB with authentication
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure logging
- [ ] Set up monitoring

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5001
CMD ["node", "src/app.js"]
```

## 📈 Performance

### Optimization Features
- **Database indexing** on frequently queried fields
- **Query optimization** with Mongoose
- **Response caching** (can be implemented)
- **Connection pooling** with MongoDB
- **Async/await** for non-blocking operations

## 🔍 Monitoring

### Health Checks
- **Service health**: `/api/health`
- **Database connectivity**: Automatic checks
- **Python service**: `/api/recommendations/health`

### Logging
- **Request logging**: Morgan HTTP logger
- **Error logging**: Detailed error tracking
- **Activity logging**: User action tracking
- **Performance logging**: Response time monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the error logs

---

**Built with ❤️ for movie enthusiasts everywhere!** 