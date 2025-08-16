# Implementation Plan

## Dependency-ordered roadmap (each step depends on the previous)

- [x] 1. Core setup and infrastructure (Section 1)
- [x] 2. Authentication and user management (Section 2)
- [x] 3. Marketplace core listings CRUD and browse (Section 6.1)
- [x] 4. Image uploads for product photos (Section 14)
- [x] 5. Buyer/Seller messaging system (Section 15)
- [ ] 6. Transaction management and payments (Merge Sections 7 + 16)
- [x] 7. Ratings and reviews (Merge Sections 9 + 17) - **Enhanced with form accessibility fixes**
- [ ] 8. Advanced analytics and reporting (Sections 10.2 + 18)
- [ ] 9. Market data management system (Section 3)
- [ ] 10. Weather service integration (Section 5)
- [ ] 11. Multi-channel communication: SMS & USSD (Section 4)
- [ ] 12. Administrative dashboard (Section 10.1)
- [ ] 13. Mobile/PWA optimization (Section 11)
- [ ] 14. Comprehensive testing suite (Section 12)
- [ ] 15. Deployment & monitoring (Section 13)
- [ ] 16. Community and expert interaction features (Section 8)

Notes:
- Section 9 (Develop rating and review system) and Section 17 (User Ratings and Reviews) have been merged under "Ratings and reviews" (Step 7) to remove duplication.
- Section 16 (Transaction Management and Payments) is consolidated under "Transaction management and payments" (Step 6) together with Section 7 payment integrations.

- [x] 1. Set up Next.js project structure and core infrastructure
  - Create Next.js 14 project with TypeScript and App Router
  - Configure Tailwind CSS for styling and responsive design
  - Set up Prisma ORM with PostgreSQL database schema
  - Configure Redis connection for caching and real-time features
  - Set up environment variables and configuration management
  - _Requirements: 11.1, 11.4_

- [x] 2. Implement authentication and user management system
  - [x] 2.1 Create Prisma schema and user data models
    - Define User, Role, and Session models in Prisma schema
    - Implement user model with validation (email, password, location)
    - Generate Prisma client and run database migrations
    - _Requirements: 1.1, 4.4, 5.1_

  - [x] 2.2 Set up NextAuth.js with email/password authentication
    - Configure NextAuth.js with credentials provider (email & password)
    - Create registration and login API routes and UI
    - Implement session management and JWT token handling
    - Add role-based access control middleware for API routes
    - _Requirements: 5.1, 7.1, 8.1_

  - [ ] 2.3 (Later) Add custom phone authentication
    - Configure NextAuth.js with custom phone number provider
    - Create phone verification API routes with SMS integration
    - Implement phone-based session management
    - _Requirements: 5.1, 7.1, 8.1_

  - [x] 2.4 Build user profile management pages and API routes
    - Create user registration page with form validation
    - Build user profile management page
    - Implement API routes for user profile updates
    - Add location-based preferences and multi-channel settings
    - **Enhanced with comprehensive account settings including billing, security, and notifications**
    - _Requirements: 4.4, 1.2, 2.1_

- [ ] 3. Build market data management system
  - [ ] 3.1 Create market price data models and API routes
    - Add MarketPrice model to Prisma schema with indexing
    - Build API routes for price data CRUD operations
    - Create price validation utilities and quality grading functions
    - Implement data aggregation functions for regional pricing
    - _Requirements: 1.1, 1.3, 3.1_

  - [ ] 3.2 Build price submission pages and validation system
    - Create price submission form page for farmers
    - Build API routes for crowdsourced data submission
    - Implement data validation logic against existing prices
    - Create extension officer review dashboard and approval workflow
    - _Requirements: 3.1, 3.2, 3.3, 7.1, 7.2_

  - [ ] 3.3 Implement price alerts and trend analysis
    - Build price change detection background jobs
    - Create subscription-based price alert system with Redis
    - Implement notification queuing and delivery API routes
    - Add price trend analysis pages with charts and reporting
    - _Requirements: 1.2, 1.3, 3.2_

- [ ] 4. Develop multi-channel communication system
  - [ ] 4.1 Build SMS integration API routes
    - Create API routes for SMS gateway integration
    - Build SMS message formatting utilities for price and weather data
    - Implement SMS webhook handlers for incoming messages and delivery status
    - Add SMS command parsing logic for basic queries
    - _Requirements: 4.2, 1.4, 2.4_

  - [ ] 4.2 Implement USSD gateway integration
    - Create API routes for USSD session handling
    - Build USSD menu structure and navigation logic
    - Implement menu-driven price queries without internet connection
    - Add USSD-based subscription management workflows
    - _Requirements: 4.3, 1.4_

  - [ ] 4.3 Create unified notification service with React components
    - Build notification abstraction layer API routes for multiple channels
    - Create React components for in-app notification display
    - Implement user preference-based channel selection in settings page
    - Add notification template system and delivery tracking dashboard
    - _Requirements: 4.4, 1.2, 2.2_

- [ ] 5. Implement weather service integration
  - [ ] 5.1 Build weather data API routes and pages
    - Create API routes for weather data collection from OpenWeatherMap
    - Build weather dashboard page with location-based forecasts
    - Implement weather data caching with Redis and refresh strategies
    - Add severe weather alert API routes and notification system
    - _Requirements: 2.1, 2.2_

  - [ ] 5.2 Create agricultural advice pages and recommendation system
    - Build crop-specific weather advice generation API routes
    - Create agricultural advice dashboard with seasonal recommendations
    - Implement planting timing calculator page based on weather patterns
    - Add pest and disease risk assessment components and alerts
    - _Requirements: 2.3, 2.4, 6.4_

- [x] 6. Develop marketplace and trading functionality
  - [x] 6.1 Create product listing pages and management system
    - Add ProductListing model to Prisma schema with image support
    - Build product listing creation page with image upload components
    - Create marketplace browse page with search and filtering by crop, location, price
    - Implement listing management dashboard with expiration and status tracking
    - _Requirements: 8.1, 8.2, 9.1_

  - [ ] 6.2 Build buyer-farmer communication pages and API routes
    - Create direct messaging page components between users
    - Build interest expression and negotiation workflow pages
    - Implement transaction initiation API routes and tracking dashboard
    - Add communication history page and thread management components
    - _Requirements: 8.3, 9.1, 9.3_

  - [ ] 6.3 Create transaction and order management pages
    - Add Transaction model to Prisma schema with status tracking
    - Build order confirmation and fulfillment workflow pages
    - Create delivery coordination page and pickup arrangement system
    - Implement transaction completion page with feedback collection forms
    - _Requirements: 8.4, 9.3, 10.1_

- [ ] 7. Implement mobile money payment integration
  - [ ] 7.1 Build mobile money API routes and service abstraction
    - Create API routes for MTN Mobile Money integration
    - Implement Airtel Money API integration with webhook handlers
    - Build payment request and callback handling API routes
    - Add payment status tracking dashboard and reconciliation pages
    - _Requirements: 5.1, 5.2, 9.2_

  - [ ] 7.2 Create subscription billing pages and system
    - Build subscription plan management pages (basic/premium)
    - Create recurring payment processing API routes
    - Implement subscription renewal and expiration handling workflows
    - Add payment failure retry logic and grace period management pages
    - _Requirements: 5.2, 5.3, 5.4_

  - [ ] 7.3 Build marketplace payment and escrow pages
    - Create secure payment processing pages for marketplace transactions
    - Build escrow service API routes for buyer-farmer transactions
    - Implement dispute resolution pages and refund mechanism workflows
    - Add payment verification dashboard and fraud detection components
    - _Requirements: 9.2, 9.4_

- [ ] 8. Build community and expert interaction features
  - [ ] 8.1 Create farmer community platform pages and components
    - Build question and answer page components for farmers
    - Create knowledge sharing repository page with best practices
    - Implement searchable content categorization by crop and region
    - Add community moderation dashboard and content approval workflow
    - _Requirements: 6.1, 6.3, 7.3_

  - [ ] 8.2 Build expert verification and advisory system pages
    - Create extension officer credential verification dashboard
    - Build expert content publishing page and approval workflow
    - Implement expert notification system API routes for farmer questions
    - Add expert response tracking dashboard and quality metrics components
    - _Requirements: 6.2, 7.1, 7.2, 7.3_

- [ ] 9. Develop rating and review system
  - [ ] 9.1 Build user rating and feedback pages and components
    - Add Rating and Review models to Prisma schema
    - Create post-transaction rating prompt components
    - Build rating calculation API routes and display components
    - Add review moderation dashboard and authenticity verification
    - _Requirements: 10.1, 10.2, 10.3_

  - [ ] 9.2 Implement trust and reputation management pages
    - Build user reputation scoring API routes and algorithms
    - Create fraud detection dashboard and account flagging system
    - Implement account restriction and suspension workflow pages
    - Add trust indicators and verification badge components
    - _Requirements: 10.4_

- [ ] 10. Create administrative dashboard and monitoring
  - [ ] 10.1 Build admin dashboard pages for platform management
    - Create admin user management and moderation interface pages
    - Build data quality monitoring dashboard and review tools
    - Implement subscription and payment analytics dashboard with charts
    - Add system health and performance monitoring components
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 10.2 Build analytics and reporting dashboard pages
    - Create user engagement and retention analytics pages with visualizations
    - Build market data quality and accuracy reporting dashboard
    - Implement financial reporting pages for subscriptions and transactions
    - Add platform usage and growth metrics tracking components
    - _Requirements: 11.3_

- [ ] 11. Optimize Next.js application for mobile and PWA
  - [ ] 11.1 Create Progressive Web App (PWA) configuration
    - Configure Next.js PWA with service worker and offline support
    - Build responsive mobile-first UI components with Tailwind CSS
    - Implement image upload API routes and management for product listings
    - Add offline capability and data synchronization with IndexedDB
    - _Requirements: 4.1, 8.1, 9.1_

  - [ ] 11.2 Build push notification system with Next.js
    - Integrate Firebase Cloud Messaging (FCM) with Next.js API routes
    - Create targeted push notification API routes based on user preferences
    - Build notification scheduling system and delivery tracking pages
    - Add rich notification components with images and action buttons
    - _Requirements: 1.2, 2.2, 4.1_

- [ ] 12. Implement comprehensive testing suite
  - [ ] 12.1 Create unit tests for core business logic
    - Write unit tests for all service layer functions
    - Test data validation and model constraints
    - Create mock implementations for external services
    - Add test coverage reporting and quality gates
    - _Requirements: All requirements validation_

  - [ ] 12.2 Build integration and end-to-end tests
    - Create API endpoint integration tests
    - Test multi-channel notification delivery workflows
    - Build payment processing integration tests
    - Add database transaction and data integrity tests
    - _Requirements: All requirements validation_

- [ ] 13. Set up deployment and production infrastructure
  - [ ] 13.1 Create production deployment configuration
    - Set up Docker containers for all services
    - Configure production database with backup and recovery
    - Implement load balancing and auto-scaling
    - Add SSL certificates and security hardening
    - _Requirements: 11.4_

  - [ ] 13.2 Implement monitoring and alerting
    - Set up application performance monitoring (APM)
    - Create business metrics dashboards
    - Implement error tracking and alerting
    - Add uptime monitoring for external service dependencies
    - _Requirements: 11.1, 11.2, 11.4_

## 🆕 **NEW PRIORITY FEATURES** (Added to Task List)

- [x] 14. **Image Uploads for Product Photos**
  - [x] 14.1 Set up cloud storage integration (Vercel Blob)
  - [x] 14.2 Create image upload components with drag & drop
  - [x] 14.3 Implement image optimization and thumbnail generation
  - [x] 14.4 Add image management and deletion functionality
  - [x] 14.5 Build image gallery for product listings
  - [x] 14.6 Implement comprehensive image editing in listing management
  - [x] 14.7 Add primary image selection and reordering capabilities

- [x] 15. **Buyer/Seller Messaging System**
  - [x] 15.1 Create Message and Conversation models in Prisma schema
  - [x] 15.2 Build real-time messaging with WebSocket integration
  - [x] 15.3 Create messaging interface with conversation threads
  - [x] 15.4 Implement message notifications and read receipts
  - [x] 15.5 Add file sharing and media support in messages

- [ ] 16. **Transaction Management and Payments**
  - [ ] 16.1 Create Transaction and Order models in Prisma schema
  - [ ] 16.2 Build order creation and confirmation workflow
  - [ ] 16.3 Implement payment processing with mobile money integration
  - [ ] 16.4 Create escrow service for secure transactions
  - [ ] 16.5 Build transaction history and status tracking

- [x] 17. **User Ratings and Reviews**
  - [x] 17.1 Create Rating and Review models in Prisma schema
  - [x] 17.2 Build post-transaction rating system
  - [x] 17.3 Implement review moderation and authenticity verification
  - [x] 17.4 Create user reputation scoring algorithms
  - [x] 17.5 Build trust indicators and verification badges
  - [x] 17.6 **Enhanced:** Fix form accessibility - proper id/name attributes and label associations
  - [x] 17.7 **Enhanced:** Resolve review submission failures - reviewType validation and error handling
  - [x] 17.8 **Enhanced:** Marketplace image display improvements and mobile-first design optimization

- [ ] 18. **Advanced Analytics and Reporting**
  - [ ] 18.1 Create analytics dashboard with key metrics
  - [ ] 18.2 Implement user behavior tracking and insights
  - [ ] 18.3 Build market performance analytics and trends
  - [ ] 18.4 Create financial reporting and revenue analytics
  - [ ] 18.5 Implement data visualization with charts and graphs

## 🎉 **Recent Accomplishments**

**✅ JUST COMPLETED:**
- **Form Accessibility Compliance:** Fixed 50+ form elements across 12 files with proper id/name attributes and label associations for WCAG compliance and browser autofill support
- **Review System Bug Fixes:** Resolved review submission failures by fixing reviewType enum validation, improving API error handling, and enhancing client-side validation
- **Marketplace Image Restoration:** Fixed missing product images by correcting data structure access and maintaining mobile-first responsive design
- **Mobile UI Optimization:** Enhanced marketplace and my-listings pages with streamlined mobile-first design, compact layouts, and improved touch targets

## 📊 **Current Progress Summary**

**✅ COMPLETED (6/18 major sections):**
- Project setup and infrastructure (100%)
- Authentication and user management (100%) - **Enhanced with comprehensive profile settings**
- Marketplace and trading functionality (100%)
- Image uploads for product photos (100%) - **Enhanced with full editing capabilities**
- Buyer/Seller messaging system (100%) - **Real-time chat with notifications**
- User ratings and reviews (100%) - **Comprehensive review system with statistics**

**🔄 IN PROGRESS:**
- None currently

**⏳ PENDING (12/18 major sections):**
- Market data management system
- Multi-channel communication system
- Weather service integration
- Mobile money payment integration
- Community and expert interaction features

- Administrative dashboard and monitoring
- Mobile and PWA optimization
- Testing suite
- Production deployment
- **NEW:** Messaging, transactions, ratings, analytics

**🎯 NEXT IMMEDIATE PRIORITIES:**
1. **Market data management system (Section 3)** - Price data, market intelligence, and agricultural insights
   - Essential foundation for the agricultural platform
   - Provides real-time pricing information for farmers and buyers
   - Enables market trend analysis and price alerts
2. **Advanced analytics and reporting (Section 10.2 + 18)** - Business intelligence and platform insights  
   - Build on the admin dashboard foundation
   - Provide detailed user and marketplace analytics
3. **Weather service integration (Section 5)** - Agricultural insights and recommendations
   - Critical for farmer decision-making
   - Complements market data with environmental factors
4. **Multi-channel communication: SMS & USSD (Section 4)** - Offline accessibility for rural farmers