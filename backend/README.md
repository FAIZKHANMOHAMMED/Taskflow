# Task Management Backend API

A Node.js/Express backend for the Task Management application with MongoDB database and JWT authentication.

## 🚀 Features

- **Authentication**: JWT-based authentication with signup/login
- **User Management**: User profiles with preferences
- **Board Management**: Create, update, delete boards with member management
- **Task Management**: Full CRUD operations for tasks with drag-and-drop support
- **Column Management**: Organize tasks in customizable columns
- **Comments**: Add comments to tasks
- **Security**: Rate limiting, CORS, input validation, password hashing

## 📋 Prerequisites

Before running the backend, ensure you have:

- [Node.js](https://nodejs.org/) (v16 or later)
- [MongoDB](https://www.mongodb.com/try/download/community) (v4.4 or later)

## 🛠 MongoDB Installation

### Windows

1. **Download MongoDB Community Server**:
   - Visit [MongoDB Download Center](https://www.mongodb.com/try/download/community)
   - Select Windows platform
   - Download and run the installer

2. **Install MongoDB**:
   - Run the installer with default settings
   - MongoDB will be installed to `C:\Program Files\MongoDB\`

3. **Start MongoDB Service**:
   ```powershell
   # Option 1: Start as Windows Service (recommended)
   net start MongoDB
   
   # Option 2: Start manually
   "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
   ```

4. **Verify Installation**:
   ```powershell
   "C:\Program Files\MongoDB\Server\7.0\bin\mongo.exe"
   ```

### Alternative: MongoDB Atlas (Cloud)

If you prefer a cloud solution:

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string
4. Update the `MONGODB_URI` in your `.env` file

## 🚦 Quick Start

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Setup**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your settings
   ```

3. **Start the Server**:
   ```bash
   # Development mode (with hot reload)
   npm run dev
   
   # Production mode
   npm start
   ```

4. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   ```

## 🔧 Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanagement

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:8080
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user

### Boards
- `GET /api/boards` - Get all boards for user
- `POST /api/boards` - Create a new board
- `GET /api/boards/:id` - Get board details with columns and tasks
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

### Tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update task
- `PUT /api/tasks/:id/move` - Move task between columns
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task

## 🗄️ Database Schema

### User
- Personal information (firstName, lastName, email)
- Authentication (password hash)
- Preferences (theme, notifications)
- Role and status

### Board
- Board details (title, description)
- Owner and members with roles
- Customization options

### Column
- Column properties (title, position)
- Board association
- Display options

### Task
- Task details (title, description, priority, status)
- Assignment and creation info
- Due dates and completion tracking
- Comments and attachments

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Server-side validation
- **CORS Protection**: Configurable origins
- **Helmet**: Security headers

## 🚀 Deployment

### Production Environment

1. **Set Production Environment**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your_secure_production_secret
   MONGODB_URI=your_production_mongodb_uri
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Development

### Project Structure
```
backend/
├── models/          # MongoDB schemas
├── routes/          # API route handlers
├── middleware/      # Custom middleware
├── server.js        # Express server setup
├── package.json     # Dependencies and scripts
└── .env            # Environment variables
```

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (when implemented)

## 📝 License

This project is licensed under the MIT License.
