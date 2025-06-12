# MeetCute Backend

This is the backend service for the MeetCute dating platform, built with Node.js, Express, and PostgreSQL.

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm 8+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/meetcute-backend.git
   cd meetcute-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your database credentials and other settings.

4. **Run the setup script**
   ```bash
   npm run setup
   ```
   This will guide you through the initial setup process.

### Database Setup

1. **Run migrations**
   ```bash
   npm run migrate
   ```

2. **Seed the database**
   ```bash
   npm run seed
   ```
   This will create an admin user and seed initial data.

### Running the Application

- **Development mode**
  ```bash
  npm run dev
  ```
  The server will restart automatically when you make changes.

- **Production mode**
  ```bash
  npm start
  ```

## 📂 Project Structure

```
backend/
├── config/               # Configuration files
├── controllers/          # Route controllers
├── middleware/           # Custom middleware
├── migrations/           # Database migrations
├── models/              # Database models
├── routes/              # API routes
├── scripts/             # Utility scripts
├── services/            # Business logic
├── uploads/             # File uploads (not versioned)
├── .env                 # Environment variables (not versioned)
├── .env.example         # Example environment variables
├── .sequelizerc         # Sequelize configuration
├── package.json         # Project dependencies
└── server.js            # Application entry point
```

## 🔧 Available Scripts

- `npm start` - Start the server in production mode
- `npm run dev` - Start the server in development mode with hot-reload
- `npm run setup` - Run the setup wizard
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed the database with initial data
- `npm run create:admin` - Create an admin user
- `npm test` - Run tests (coming soon)

## 🌐 API Documentation

API documentation is available at `/api-docs` when the server is running.

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Node environment | `development` |
| PORT | Server port | `5000` |
| JWT_SECRET | Secret for JWT tokens | (randomly generated) |
| FRONTEND_URL | Frontend URL for CORS | `http://localhost:5173` |
| DB_HOST | Database host | `localhost` |
| DB_PORT | Database port | `5432` |
| DB_NAME | Database name | `meetcute` |
| DB_USER | Database user | `postgres` |
| DB_PASSWORD | Database password | `postgres` |
| EMAIL_* | Email configuration | (see .env.example) |

## 🚀 Deployment

See the [deployment guide](../DEPLOYMENT.md) for instructions on deploying to production.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
