# Admin Access Issue - Resolution

## Problem Description

Admins were getting "Access denied. Admin privileges required" when trying to access `/admin` routes.

## Root Cause

The issue was that the database didn't have any admin roles or admin users created. The system expected users to have either 'admin' or 'superadmin' roles to access the admin panel, but these roles hadn't been created in the database.

## Solution Implemented

### 1. Database Setup Scripts

Created comprehensive database setup scripts to initialize the required roles and users:

- **`scripts/setup-database.js`** - Complete database setup
- **`scripts/setup-admin.js`** - Admin-only setup
- **`scripts/test-admin-access.js`** - Verification script

### 2. Admin Users Created

The setup scripts create the following admin users:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `admin@farmermarket.com` | `admin123` | admin | System Administrator |
| `superadmin@farmermarket.com` | `superadmin123` | superadmin | Super Administrator |
| `user@farmermarket.com` | `user123` | user | Sample Regular User |

### 3. User Roles Created

The following roles are now available in the system:
- `user` - Regular platform user
- `farmer` - Farmer user
- `buyer` - Buyer user  
- `expert` - Expert user
- `admin` - Administrator
- `superadmin` - Super Administrator

## How to Use

### Initial Setup

1. **Run database setup**:
   ```bash
   npm run setup-db
   ```

2. **Verify setup**:
   ```bash
   npm run test-admin
   ```

### Accessing Admin Panel

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Login with admin credentials**:
   - Go to: `http://localhost:3000/login`
   - Use either:
     - Admin: `admin@farmermarket.com` / `admin123`
     - Superadmin: `superadmin@farmermarket.com` / `superadmin123`

3. **Navigate to admin panel**:
   - Go to: `http://localhost:3000/admin`

## Available Admin Routes

Once logged in as admin, you can access:

- `/admin` - Dashboard overview
- `/admin/users` - User management
- `/admin/moderation/community` - Community moderation
- `/admin/moderation/reviews` - Review moderation
- `/admin/market-prices` - Market price management
- `/admin/analytics/overview` - Analytics dashboard

## Authentication Logic

The admin layout (`app/admin/layout.tsx`) checks:

1. User authentication status
2. User role (must be 'admin' or 'superadmin')
3. Redirects unauthorized users with error message

## Security Notes

- **Development Only**: Default passwords are for development/testing
- **Production**: Change passwords and secure admin credentials
- **Role-Based Access**: Admin routes are protected by role verification
- **Session Management**: Uses NextAuth.js for secure authentication

## Troubleshooting

### Still Getting Access Denied?

1. **Check if admin users exist**:
   ```bash
   npm run test-admin
   ```

2. **Re-run setup if needed**:
   ```bash
   npm run setup-db
   ```

3. **Verify database connection**:
   - Ensure PostgreSQL is running
   - Check environment variables
   - Verify Prisma migrations completed

4. **Check user role assignment**:
   - Verify user has correct `roleId`
   - Ensure Role table has admin entries

### Common Issues

- **Prisma client not generated**: Run `npx prisma generate`
- **Database not migrated**: Run `npx prisma migrate dev`
- **Environment variables missing**: Check `.env.local` file
- **Session expired**: Try logging out and back in

## Files Modified

- `scripts/setup-database.js` - New comprehensive setup script
- `scripts/setup-admin.js` - New admin setup script  
- `scripts/test-admin-access.js` - New verification script
- `package.json` - Added npm scripts
- `SETUP.md` - Updated with admin setup instructions
- `scripts/README.md` - Updated with new scripts documentation

## Next Steps

1. **Test admin access** with the provided credentials
2. **Customize admin users** as needed for your environment
3. **Implement additional security** for production deployment
4. **Set up proper password policies** for admin accounts
