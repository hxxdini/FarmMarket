const { PrismaClient } = require('../lib/generated/prisma')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function setupAdmin() {
  try {
    console.log('Setting up admin roles and user...')

    // Create roles if they don't exist
    const roles = ['user', 'admin', 'superadmin']
    
    for (const roleName of roles) {
      const existingRole = await prisma.role.findUnique({
        where: { name: roleName }
      })
      
      if (!existingRole) {
        const role = await prisma.role.create({
          data: {
            id: `role_${roleName}_${Date.now()}`,
            name: roleName
          }
        })
        console.log(`Created role: ${role.name}`)
      } else {
        console.log(`Role already exists: ${existingRole.name}`)
      }
    }

    // Get the admin role
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    })

    if (!adminRole) {
      throw new Error('Admin role not found')
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: 'admin@farmermarket.com' }
    })

    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    
          const adminUser = await prisma.user.create({
        data: {
          id: `admin_${Date.now()}`,
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

    console.log('Admin user created successfully!')
    console.log('Email: admin@farmermarket.com')
    console.log('Password: admin123')
    console.log('User ID:', adminUser.id)

  } catch (error) {
    console.error('Error setting up admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupAdmin()
