# FlokiPOS Backend API

This is the backend API server for the FlokiPOS system, built with Node.js, Express, and SQLite.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration.

3. **Run database setup:**

   ```bash
   node scripts/setup.js
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # Database models and migrations
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── app.js          # Express app configuration
├── data/               # SQLite database files
├── uploads/            # File uploads
├── logs/               # Application logs
├── scripts/            # Utility scripts
└── server.js           # Server entry point
```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=./data/database.sqlite

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Payment Gateway (Kashier.io)
KASHIER_API_KEY=your-kashier-api-key
KASHIER_API_SECRET=your-kashier-api-secret
```

## 🗄️ Database

### Schema

The database includes the following main tables:

- **users** - Client and admin accounts
- **categories** - Product and service categories
- **products** - Inventory items
- **services** - Bookable services
- **staff** - Staff members
- **customers** - Customer database
- **receipts** - Sales transactions
- **bookings** - Service appointments

### Migrations

Run migrations:

```bash
npm run migrate
```

Rollback migrations:

```bash
npm run migrate:rollback
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password
- `POST /api/auth/logout` - Logout

### Default Users

After running setup, these users are created:

- **Admin**: `admin@flokipos.com` / `admin123`
- **Client**: `client@demo.com` / `client123`

## 📡 API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/change-password` - Change password

### Products

- `GET /api/products` - Get products list
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product details
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Customers

- `GET /api/customers` - Get customers list
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer details
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Staff

- `GET /api/staff` - Get staff list
- `POST /api/staff` - Create staff member
- `GET /api/staff/:id` - Get staff details
- `PUT /api/staff/:id` - Update staff member
- `DELETE /api/staff/:id` - Delete staff member

### Services

- `GET /api/services` - Get services list
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service details
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Bookings

- `GET /api/bookings` - Get bookings list
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Delete booking

### POS

- `POST /api/pos/sale` - Process sale
- `GET /api/pos/receipts` - Get receipts list
- `GET /api/pos/receipt/:id` - Get receipt details

## 🛡️ Security

### Middleware

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Request rate limiting
- **JWT Authentication** - Token-based auth
- **Input Validation** - Request validation

### Best Practices

- All passwords are hashed with bcrypt
- JWT tokens have expiration
- Rate limiting on API endpoints
- Input validation on all endpoints
- SQL injection protection with Knex
- XSS protection with Helmet

## 📊 Monitoring

### Health Check

Check API health:

```bash
curl http://localhost:3001/health
```

### Logging

Logs are stored in `./logs/app.log`

## 🧪 Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 🚀 Deployment

### Production

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up SSL certificates
6. Use PM2 or similar process manager

### Docker

Build and run with Docker:

```bash
docker build -t flokipos-backend .
docker run -p 3001:3001 flokipos-backend
```

## 📝 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run migrate:rollback` - Rollback migrations
- `npm run seed` - Run database seeds
- `npm test` - Run tests
- `npm run lint` - Run ESLint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
