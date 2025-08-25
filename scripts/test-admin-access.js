const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()

async function testAdminAccess() {
  try {
    console.log('🔍 Testing admin access...\n')

    // Test 1: Check if admin roles exist
    console.log('📋 Checking admin roles...')
    const adminRole = await prisma.role.findUnique({
      where: { name: 'admin' }
    })
    
    const superadminRole = await prisma.role.findUnique({
      where: { name: 'superadmin' }
    })

    if (adminRole) {
      console.log('✅ Admin role exists:', adminRole.id)
    } else {
      console.log('❌ Admin role not found')
    }

    if (superadminRole) {
      console.log('✅ Superadmin role exists:', superadminRole.id)
    } else {
      console.log('❌ Superadmin role not found')
    }

    // Test 2: Check if admin users exist
    console.log('\n👤 Checking admin users...')
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@farmermarket.com' },
      include: { Role: true }
    })
    
    const superadminUser = await prisma.user.findFirst({
      where: { email: 'superadmin@farmermarket.com' },
      include: { Role: true }
    })

    if (adminUser) {
      console.log('✅ Admin user exists:', adminUser.email)
      console.log('   Role:', adminUser.Role?.name)
      console.log('   Status:', adminUser.status)
    } else {
      console.log('❌ Admin user not found')
    }

    if (superadminUser) {
      console.log('✅ Superadmin user exists:', superadminUser.email)
      console.log('   Role:', superadminUser.Role?.name)
      console.log('   Status:', superadminUser.status)
    } else {
      console.log('❌ Superadmin user not found')
    }

    // Test 3: Verify role assignments
    console.log('\n🔗 Verifying role assignments...')
    if (adminUser && adminUser.Role?.name === 'admin') {
      console.log('✅ Admin user has correct role assignment')
    } else if (adminUser) {
      console.log('❌ Admin user has incorrect role:', adminUser.Role?.name)
    }

    if (superadminUser && superadminUser.Role?.name === 'superadmin') {
      console.log('✅ Superadmin user has correct role assignment')
    } else if (superadminUser) {
      console.log('❌ Superadmin user has incorrect role:', superadminUser.Role?.name)
    }

    // Test 4: Check total user count
    console.log('\n📊 Database statistics...')
    const totalUsers = await prisma.user.count()
    const totalRoles = await prisma.role.count()
    
    console.log(`Total users: ${totalUsers}`)
    console.log(`Total roles: ${totalRoles}`)

    console.log('\n🎯 Admin access test completed!')
    console.log('\n💡 To test admin panel access:')
    console.log('1. Start the development server: npm run dev')
    console.log('2. Go to: http://localhost:3000/login')
    console.log('3. Login with admin credentials:')
    console.log('   - Admin: admin@farmermarket.com / admin123')
    console.log('   - Superadmin: superadmin@farmermarket.com / superadmin123')
    console.log('4. Navigate to: http://localhost:3000/admin')

  } catch (error) {
    console.error('❌ Error testing admin access:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAdminAccess()
