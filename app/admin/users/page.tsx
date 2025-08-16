"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { 
  Users, 
  Search, 
  Filter,
  Eye,
  Shield,
  UserX,
  UserCheck,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Plus
} from "lucide-react"

interface User {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  avatar?: string
  role: string
  isEmailVerified: boolean
  isPhoneVerified: boolean
  createdAt: string
  lastLoginAt?: string
  status: 'active' | 'suspended' | 'pending'
}

export default function UserManagementPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    roleName: 'user',
    status: 'ACTIVE'
  })
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    verification: 'all'
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login")
    } else if (status === "authenticated") {
      // Check if user is admin
      if ((session?.user as any)?.role !== 'admin' && (session?.user as any)?.role !== 'superadmin') {
        router.replace("/")
        toast.error("Access denied. Admin privileges required.")
        return
      }
      fetchUsers()
    }
  }, [status, session, router])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: filters.search,
        role: filters.role,
        status: filters.status,
        verification: filters.verification
      })
      
      const response = await fetch(`/api/admin/users?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        toast.error('Failed to fetch users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'verify') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        toast.success(`User ${action === 'suspend' ? 'suspended' : action === 'activate' ? 'activated' : 'verified'} successfully`)
        fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to perform action')
      }
    } catch (error) {
      console.error('Error performing user action:', error)
      toast.error('Failed to perform action')
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-800',
      superadmin: 'bg-purple-100 text-purple-800',
      user: 'bg-blue-100 text-blue-800',
      farmer: 'bg-green-100 text-green-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading users...</span>
        </div>
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-lg text-gray-600">Manage user accounts, permissions, and verification status</p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Users className="h-4 w-4 mr-1" />
                {users.length} Users
              </Badge>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Provide user details and assign a role.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input id="name" name="name" value={newUser.name} onChange={(e)=>setNewUser(p=>({...p,name:e.target.value}))} placeholder="John Doe" />
                    </div>
                    <div>
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input id="email" name="email" type="email" value={newUser.email} onChange={(e)=>setNewUser(p=>({...p,email:e.target.value}))} placeholder="john@example.com" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                      <Input id="phone" name="phone" value={newUser.phone} onChange={(e)=>setNewUser(p=>({...p,phone:e.target.value}))} placeholder="+256..." />
                    </div>
                    <div>
                      <label htmlFor="password" className="text-sm font-medium">Password</label>
                      <Input id="password" name="password" type="password" value={newUser.password} onChange={(e)=>setNewUser(p=>({...p,password:e.target.value}))} placeholder="••••••••" />
                    </div>
                    <div>
                      <label htmlFor="role" className="text-sm font-medium">Role</label>
                      <Select value={newUser.roleName} onValueChange={(v)=>setNewUser(p=>({...p,roleName:v}))}>
                        <SelectTrigger id="role" name="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="farmer">Farmer</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="superadmin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="status" className="text-sm font-medium">Status</label>
                      <Select value={newUser.status} onValueChange={(v)=>setNewUser(p=>({...p,status:v}))}>
                        <SelectTrigger id="status" name="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACTIVE">Active</SelectItem>
                          <SelectItem value="PENDING">Pending</SelectItem>
                          <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={()=>setCreateOpen(false)}>Cancel</Button>
                    <Button disabled={creating} onClick={async ()=>{
                      try{
                        setCreating(true)
                        const res = await fetch('/api/admin/users', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(newUser)})
                        if(res.ok){
                          toast.success('User created')
                          setCreateOpen(false)
                          setNewUser({name:'',email:'',phone:'',password:'',roleName:'user',status:'ACTIVE'})
                          fetchUsers()
                        }else{
                          const err = await res.json(); toast.error(err.error||'Failed to create user')
                        }
                      }catch(e){
                        console.error(e); toast.error('Failed to create user')
                      }finally{setCreating(false)}
                    }}>Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter users by role, status, and verification</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="search" className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    name="search"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="filterRole" className="text-sm font-medium">Role</label>
                <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger id="filterRole" name="filterRole">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="farmer">Farmer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="filterStatus" className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger id="filterStatus" name="filterStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="filterVerification" className="text-sm font-medium">Verification</label>
                <Select value={filters.verification} onValueChange={(value) => setFilters(prev => ({ ...prev, verification: value }))}>
                  <SelectTrigger id="filterVerification" name="filterVerification">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="unverified">Unverified</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={fetchUsers} className="w-full">
                  <Filter className="h-4 w-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-6">
          {users.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </Card>
          ) : (
            users.map((user) => (
              <Card key={user.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback>{user.name ? user.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) : 'U'}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{user.name || 'Unnamed User'}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getRoleColor(user.role)}>
                            {user.role}
                          </Badge>
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                      {user.lastLoginAt && (
                        <p className="text-xs text-gray-400">
                          Last login: {new Date(user.lastLoginAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* User Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{user.email}</span>
                        {user.isEmailVerified && (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <UserCheck className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{user.phone}</span>
                          {user.isPhoneVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-300">
                              <UserCheck className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {user.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{user.location}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/users/${user.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Profile
                        </Button>
                        {/* Quick role assignment */}
                        <Select onValueChange={(v)=>{
                          fetch(`/api/admin/users/${user.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'assign_role', roleName:v })}).then(async r=>{
                            if(r.ok){ toast.success('Role updated'); fetchUsers() } else { const e = await r.json(); toast.error(e.error||'Failed') }
                          })
                        }}>
                          <SelectTrigger className="h-9 w-[160px]"><SelectValue placeholder={user.role} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="farmer">Farmer</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="superadmin">Super Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex space-x-2">
                        {user.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-300 hover:bg-red-50"
                            onClick={() => handleUserAction(user.id, 'suspend')}
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Suspend
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => handleUserAction(user.id, 'activate')}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Activate
                          </Button>
                        )}
                        
                        {!user.isEmailVerified && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleUserAction(user.id, 'verify')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Verify Email
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
