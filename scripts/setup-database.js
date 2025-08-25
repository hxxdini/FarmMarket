const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Farmer Market Platform database...\n')

    // Step 1: Create roles
    console.log('📋 Creating roles...')
    const roles = ['user', 'farmer', 'buyer', 'expert', 'admin', 'superadmin']
    const createdRoles = {}
    
    for (const roleName of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleName }
      })
      
      if (!existingRole) {
        const role = await prisma.role.create({
          data: {
            id: `role_${roleName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: roleName
          }
        })
        createdRoles[roleName] = role
        console.log(`✅ Created role: ${role.name}`)
      } else {
        createdRoles[roleName] = existingRole
        console.log(`ℹ️  Role already exists: ${existingRole.name}`)
      }
    }

    // Step 2: Create admin user
    console.log('\n👤 Setting up admin user...')
    
    const adminRole = createdRoles['admin']
    if (!adminRole) {
      throw new Error('Admin role not found')
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@farmermarket.com' }
    })

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists')
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const adminUser = await prisma.user.create({
        data: {
          id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: 'admin@farmermarket.com',
          name: 'System Administrator',
          password: hashedPassword,
          roleId: adminRole.id,
          phone: '+1234567890',
          location: 'System',
          isEmailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })

      console.log('✅ Admin user created successfully!')
      console.log('📧 Email: admin@farmermarket.com')
      console.log('🔑 Password: admin123')
      console.log('🆔 User ID:', adminUser.id)
    }

    // Step 3: Create superadmin user
    console.log('\n👑 Setting up superadmin user...')
    
    const superadminRole = createdRoles['superadmin']
    if (!superadminRole) {
      throw new Error('Superadmin role not found')
    }

    // Check if superadmin user already exists
    const existingSuperadmin = await prisma.user.findFirst({
      where: { email: 'superadmin@farmermarket.com' }
    })

    if (existingSuperadmin) {
      console.log('ℹ️  Superadmin user already exists')
    } else {
      // Create superadmin user
      const hashedPassword = await bcrypt.hash('superadmin123', 12)
      
      const superadminUser = await prisma.user.create({
        data: {
          id: `superadmin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: 'superadmin@farmermarket.com',
          name: 'Super Administrator',
          password: hashedPassword,
          roleId: superadminRole.id,
          phone: '+1234567892',
          location: 'System',
          isEmailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })

      console.log('✅ Superadmin user created successfully!')
      console.log('📧 Email: superadmin@farmermarket.com')
      console.log('🔑 Password: superadmin123')
      console.log('🆔 User ID:', superadminUser.id)
    }

    // Step 4: Create sample regular user
    console.log('\n👥 Creating sample regular user...')
    
    const userRole = createdRoles['user']
    if (!userRole) {
      throw new Error('User role not found')
    }

    // Check if sample user already exists
    const existingSampleUser = await prisma.user.findFirst({
      where: { email: 'user@farmermarket.com' }
    })

    if (existingSampleUser) {
      console.log('ℹ️  Sample user already exists')
    } else {
      // Create sample user
      const hashedPassword = await bcrypt.hash('user123', 12)
      
      const sampleUser = await prisma.user.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: 'user@farmermarket.com',
          name: 'Sample User',
          password: hashedPassword,
          roleId: userRole.id,
          phone: '+1234567891',
          location: 'Sample Location',
          isEmailVerified: true,
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })

      console.log('✅ Sample user created successfully!')
      console.log('📧 Email: user@farmermarket.com')
      console.log('🔑 Password: user123')
      console.log('🆔 User ID:', sampleUser.id)
    }

    console.log('\n🎉 Database setup completed successfully!')
    console.log('\n📝 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('👑 Superadmin: superadmin@farmermarket.com / superadmin123')
    console.log('👤 Admin: admin@farmermarket.com / admin123')
    console.log('👥 User: user@farmermarket.com / user123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n💡 You can now log in with these credentials to test the system!')

  } catch (error) {
    console.error('❌ Error setting up database:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

setupDatabase()
