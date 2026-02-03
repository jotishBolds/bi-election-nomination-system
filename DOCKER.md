# Docker Scripts for BI Election Nomination System

This directory contains Docker configuration for the BI Election Nomination System.

## Files Overview

- `Dockerfile` - Production Docker image for the Next.js application
- `docker-compose.yml` - Full production stack (app + database + redis)
- `docker-compose.dev.yml` - Development services (database + redis only)
- `.dockerignore` - Files to exclude from Docker build context
- `.env.docker` - Environment variables template for Docker

## Quick Start

### Development (Database + Redis only)

Run only the database and Redis for local development:

```bash
# Start development services
docker-compose -f docker-compose.dev.yml up -d

# Copy environment template
cp .env.docker .env

# Run the app locally
npm install
npm run db:generate
npm run db:push
npm run dev
```

### Full Production Stack

Run the complete application stack:

```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services

### PostgreSQL Database

- **Port:** 5432
- **Database:** bi_election_db
- **User:** bi_election_user
- **Password:** secure_password_123

### Redis Cache

- **Port:** 6379
- **Persistence:** Enabled with AOF

### Next.js Application

- **Port:** 3000
- **Environment:** Production optimized

### PgAdmin (Optional)

- **Port:** 8080
- **Email:** admin@bi-election.local
- **Password:** admin123
- **Profile:** tools (enable with `--profile tools`)

## Environment Variables

Copy `.env.docker` to `.env` and customize:

```bash
cp .env.docker .env
```

Key environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL

## Database Operations

```bash
# Run migrations
docker-compose exec app npx prisma migrate deploy

# Seed database
docker-compose exec app npm run db:seed

# Access database
docker-compose exec postgres psql -U bi_election_user -d bi_election_db
```

## Development Workflow

1. **Start development services:**

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Set up environment:**

   ```bash
   cp .env.docker .env
   # Edit .env with your configuration
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Set up database:**

   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

## Production Deployment

1. **Configure environment variables:**

   ```bash
   # Edit docker-compose.yml or use external .env file
   # Update passwords and secrets
   ```

2. **Deploy:**

   ```bash
   docker-compose up --build -d
   ```

3. **Monitor:**
   ```bash
   docker-compose logs -f app
   ```

## Useful Commands

```bash
# View running containers
docker-compose ps

# Scale the application
docker-compose up --scale app=3

# Update and restart services
docker-compose pull && docker-compose up -d

# Backup database
docker-compose exec postgres pg_dump -U bi_election_user bi_election_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U bi_election_user bi_election_db < backup.sql

# Clean up volumes (WARNING: destroys data)
docker-compose down -v

# Clean up everything
docker-compose down -v --rmi all
```

## Security Notes

⚠️ **Important for Production:**

1. Change default passwords in docker-compose.yml
2. Use Docker secrets for sensitive data
3. Enable SSL/TLS
4. Configure proper firewall rules
5. Use non-root user in containers
6. Regular security updates

## Troubleshooting

### Common Issues

1. **Port conflicts:**

   ```bash
   # Check if ports are in use
   netstat -an | grep :3000
   netstat -an | grep :5432
   ```

2. **Database connection issues:**

   ```bash
   # Check if database is ready
   docker-compose exec postgres pg_isready
   ```

3. **Build issues:**

   ```bash
   # Clean rebuild
   docker-compose down
   docker-compose build --no-cache
   docker-compose up -d
   ```

4. **Permission issues:**
   ```bash
   # Fix ownership
   sudo chown -R $USER:$USER .
   ```

### Logs

```bash
# View all logs
docker-compose logs

# Follow specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```
