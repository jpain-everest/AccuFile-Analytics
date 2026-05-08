# AcuFile Backend API

A FastAPI backend application with PostgreSQL database integration.

## Project Structure

```
acufile_backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application entry point
│   ├── config.py        # Application settings
│   ├── database.py      # Database connection setup
│   ├── models/          # SQLAlchemy models
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/         # Pydantic schemas
│   │   ├── __init__.py
│   │   └── user.py
│   ├── crud/            # Database operations
│   │   ├── __init__.py
│   │   └── user.py
│   └── routers/         # API routes
│       ├── __init__.py
│       └── users.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start

### Option 1: Using Docker (Recommended)

1. **Start the application:**
   ```bash
   docker-compose up --build
   ```

2. **Access the API:**
   - API: http://localhost:8000
   - Swagger Docs: http://localhost:8000/docs
   - ReDoc: http://localhost:8000/redoc

### Option 2: Local Development

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   copy .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## API Endpoints

### Users
- `GET /api/v1/users/` - Get all users
- `GET /api/v1/users/{user_id}` - Get user by ID
- `POST /api/v1/users/` - Create new user
- `PUT /api/v1/users/{user_id}` - Update user
- `DELETE /api/v1/users/{user_id}` - Delete user

### Health
- `GET /` - Root endpoint
- `GET /health` - Health check

## Deployment Options

### 1. Railway
1. Push code to GitHub
2. Connect Railway to your repo
3. Add PostgreSQL addon
4. Set `DATABASE_URL` environment variable

### 2. Render
1. Create a new Web Service
2. Connect your GitHub repo
3. Add PostgreSQL database
4. Set environment variables

### 3. AWS (ECS/EC2)
1. Build Docker image
2. Push to ECR
3. Deploy to ECS or EC2

### 4. Heroku
1. Create Heroku app
2. Add Heroku Postgres addon
3. Deploy via Git

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `APP_NAME` | Application name | AcuFile API |
| `DEBUG` | Debug mode | False |
