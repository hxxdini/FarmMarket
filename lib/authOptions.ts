import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import type { NextAuthOptions } from 'next-auth'


export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter since you're using JWT strategy
  // adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing email or password')
        }
        const user = await prisma.user.findUnique({ where: { email: credentials.email }, include: { Role: true } })
        if (!user || !user.password) {
          throw new Error('No user found with this email')
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error('Invalid password')
        }
        return { id: user.id, email: user.email, name: user.name, role: user.Role?.name }
      },
    }),
  ],
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Add NEXTAUTH_SECRET - this is REQUIRED for JWT strategy
  secret: process.env.NEXTAUTH_SECRET,
  
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production', // true in production, false in development
      },
    },
  },
  
  callbacks: {
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          email: token.email,
          name: token.name,
          role: token.role,
        } as any
      }
      return session
    },
    
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role
      }
      return token
    },
  },
} 