# Setup Guide for Farmer Market Platform

## Environment Variables Setup

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/farmer_market_platform"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Vercel Blob (for image uploads)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token-here"

# Redis (optional, for caching)
REDIS_URL="redis://localhost:6379"

# Weather API (optional)
OPENWEATHER_API_KEY="your-openweather-api-key-here"

# SMS Gateway (optional)
SMS_API_KEY="your-sms-api-key-here"
SMS_API_SECRET="your-sms-api-secret-here"

# Mobile Money (optional)
MTN_MOBILE_MONEY_API_KEY="your-mtn-api-key-here"
AIRTEL_MONEY_API_KEY="your-airtel-api-key-here"
```

## Vercel Blob Setup

1. **Create a Vercel account** (if you don't have one):
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in

2. **Create a new project**:
   - Click "New Project"
   - Import your GitHub repository or create a new one

3. **Set up Blob storage**:
   - In your Vercel project dashboard, go to "Storage" tab
   - Click "Create Database"
   - Choose "Blob" as the storage type
   - Select a region close to your users
   - Click "Create"

4. **Get your Blob token**:
   - In the Blob dashboard, go to "Settings" tab
   - Copy the "Read/Write Token"
   - Add it to your `.env.local` file as `BLOB_READ_WRITE_TOKEN`

5. **Update your environment variables**:
   - In Vercel dashboard, go to "Settings" → "Environment Variables"
   - Add `BLOB_READ_WRITE_TOKEN` with your token value
   - Deploy your project

## Database Setup

1. **Install PostgreSQL** (if not already installed)
2. **Create database**:
   ```bash
   createdb farmer_market_platform
   ```
3. **Run migrations**:
   ```bash
   npx prisma migrate dev
   ```
4. **Generate Prisma client**:
   ```bash
   npx prisma generate
   ```
5. **Set up admin roles and users**:
   ```bash
   npm run setup-db
   ```
   This will create:
   - User roles (user, farmer, buyer, expert, admin, superadmin)
   - Admin user: admin@farmermarket.com / admin123
   - Superadmin user: superadmin@farmermarket.com / superadmin123
   - Sample user: user@farmermarket.com / user123

## Running the Application

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open in browser**:
   - Navigate to `http://localhost:3000`

## Features Implemented

### ✅ Completed
- User authentication with NextAuth.js
- User profile management with image uploads
- Product listing CRUD operations
- Image uploads using Vercel Blob
- Marketplace browsing with search and filters
- Responsive UI with Tailwind CSS

### 🔄 In Progress
- Enhanced user profile settings
- Product image management

### 📋 Next Steps
- Buyer/seller messaging system
- Transaction management and payments
- User ratings and reviews
- Advanced analytics and reporting

## Troubleshooting

### Common Issues

1. **Database connection errors**:
   - Check your `DATABASE_URL` format
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Image upload failures**:
   - Check `BLOB_READ_WRITE_TOKEN` is set correctly
   - Ensure Vercel Blob is properly configured
   - Check network connectivity

3. **Authentication issues**:
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your environment
   - Clear browser cookies if testing locally

### Getting Help

- Check the console for error messages
- Review the browser's Network tab for API failures
- Check the terminal for server-side errors
- Ensure all environment variables are properly set

### Admin Access Issues

If you're getting "Access denied. Admin privileges required" when trying to access `/admin`:

1. **Ensure admin roles are created**:
   ```bash
   npm run setup-db
   ```

2. **Check if admin user exists**:
   - Try logging in with: admin@farmermarket.com / admin123
   - Or: superadmin@farmermarket.com / superadmin123

3. **Verify database connection**:
   - Check that migrations ran successfully
   - Ensure the database contains the Role and User tables

4. **Check user role assignment**:
   - Verify the user has `roleId` pointing to an admin role
   - Ensure the Role table has entries with names 'admin' or 'superadmin'
