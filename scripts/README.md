# Scripts Directory

This directory contains utility scripts for the Farmer Market Platform.

## Available Scripts

### Database Setup Scripts

#### `setup-database.js`
Comprehensive database setup script that creates:
- All necessary user roles (user, farmer, buyer, expert, admin, superadmin)
- Admin user with credentials: admin@farmermarket.com / admin123
- Superadmin user with credentials: superadmin@farmermarket.com / superadmin123
- Sample regular user with credentials: user@farmermarket.com / user123

**Usage:**
```bash
npm run setup-db
```

#### `setup-admin.js`
Simple script to create admin roles and admin user only.

**Usage:**
```bash
npm run setup-admin
```

### Hourly Commit Script

#### `hourly-commit.sh`
Automated script for regular commits to maintain project activity.

## Running Scripts

All scripts can be run using npm commands defined in `package.json`:

```bash
# Setup complete database with all roles and users
npm run setup-db

# Setup admin roles and user only
npm run setup-admin
```

## Prerequisites

Before running the database setup scripts:

1. Ensure PostgreSQL is running
2. Database exists and is accessible
3. Prisma migrations have been run
4. Environment variables are properly configured

## Troubleshooting

If you encounter issues:

1. Check that the database is running and accessible
2. Verify that Prisma migrations completed successfully
3. Ensure all environment variables are set correctly
4. Check the console output for specific error messages

## Security Notes

- Default passwords are for development/testing only
- Change passwords in production environments
- Admin credentials should be secured in production
