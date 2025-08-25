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
  Eye,
  Shield,
  UserX,
  UserCheck,
  Loader2,
  Mail,
  Phone,
  MapPin,
  Plus,
  Trash2
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
  const [filtering, setFiltering] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<string | null>(null)
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
  const [promoting, setPromoting] = useState<string | null>(null)
  const [promoteType, setPromoteType] = useState<'EXPERT' | 'EXTENSION_OFFICER'>('EXPERT')

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (status === "authenticated") {
        setFiltering(true)
        fetchUsers()
      }
    }, 300) // 300ms delay

    return () => clearTimeout(timeoutId)
  }, [filters.search])

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
  }, [status, session, router, filters])

  const fetchUsers = async () => {
    try {
      if (!filtering) {
        setLoading(true)
      }
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
      setFiltering(false)
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

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleting(userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (response.ok) {
        toast.success('User deleted successfully')
        setDeleteConfirmOpen(null)
        fetchUsers() // Refresh the list
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    } finally {
      setDeleting(null)
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
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-base sm:text-lg text-gray-600">Manage user accounts, permissions, and verification status</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <Badge variant="outline" className={`text-center sm:text-left ${
                filters.role !== 'all' || filters.status !== 'all' || filters.verification !== 'all' || filters.search
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                <Users className="h-4 w-4 mr-1" />
                {users.length} {filters.role !== 'all' || filters.status !== 'all' || filters.verification !== 'all' || filters.search ? 'Filtered' : 'Total'} Users
              </Badge>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] max-w-md sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>Provide user details and assign a role.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 gap-4 pt-2">
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
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                    <Button variant="outline" onClick={()=>setCreateOpen(false)} className="w-full sm:w-auto">Cancel</Button>
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
                    }} className="w-full sm:w-auto">Save</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-4 sm:mb-6">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-6">
            <CardTitle className="text-base sm:text-lg">Filters</CardTitle>
            <CardDescription className="text-sm">Filter users by role, status, and verification</CardDescription>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <label htmlFor="search" className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    name="search"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                  {filtering && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
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
              

            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-3">
          {users.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your filters or search terms.</p>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role & Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Verification
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-xs">
                                {user.name ? user.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                              <div className="text-xs text-gray-500">
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                              {user.lastLoginAt && (
                                <div className="text-xs text-gray-400">
                                  Last: {new Date(user.lastLoginAt).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-[200px]">{user.email}</span>
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{user.phone}</span>
                              </div>
                            )}
                            {user.location && (
                              <div className="flex items-center space-x-2 text-sm">
                                <MapPin className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[150px]">{user.location}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <Badge className={getRoleColor(user.role)}>
                              {user.role}
                            </Badge>
                            <div>
                              <Badge className={getStatusColor(user.status)}>
                                {user.status}
                              </Badge>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">Email:</span>
                              {user.isEmailVerified ? (
                                <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                  <UserCheck className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                                  Unverified
                                </Badge>
                              )}
                            </div>
                            {user.phone && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Phone:</span>
                                {user.isPhoneVerified ? (
                                  <Badge variant="outline" className="text-green-600 border-green-300 text-xs">
                                    <UserCheck className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-red-600 border-red-300 text-xs">
                                    Unverified
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/users/${user.id}`)}
                              className="text-xs h-7 px-2"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                            
                            {/* Quick role assignment */}
                            <Select onValueChange={(v)=>{
                              fetch(`/api/admin/users/${user.id}`, {method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'assign_role', roleName:v })}).then(async r=>{
                                if(r.ok){ toast.success('Role updated'); fetchUsers() } else { const e = await r.json(); toast.error(e.error||'Failed') }
                              })
                            }}>
                              <SelectTrigger className="h-7 w-[120px] text-xs">
                                <SelectValue placeholder={user.role} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Promote to Expert / Extension Officer */}
                            <Select onValueChange={(v)=>{
                              const t = (v === 'EXTENSION_OFFICER' ? 'EXTENSION_OFFICER' : 'EXPERT') as 'EXPERT' | 'EXTENSION_OFFICER'
                              setPromoteType(t)
                              setPromoting(user.id)
                              ;(async ()=>{
                                try {
                                  const res = await fetch('/api/admin/moderation/experts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type: t, verify: true }) })
                                  if (res.ok) { toast.success(t === 'EXTENSION_OFFICER' ? 'Promoted to Extension Officer' : 'Promoted to Expert') } else { const e = await res.json(); toast.error(e.error || 'Failed to promote') }
                                } catch (e) { toast.error('Failed to promote') } finally { setPromoting(null) }
                              })()
                            }}>
                              <SelectTrigger className="h-7 w-[190px] text-xs">
                                <SelectValue placeholder="Promote to Expert..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="EXPERT">Set as Expert</SelectItem>
                                <SelectItem value="EXTENSION_OFFICER">Set as Extension Officer</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {user.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-7 px-2"
                                onClick={() => handleUserAction(user.id, 'suspend')}
                              >
                                <UserX className="h-3 w-3 mr-1" />
                                Suspend
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-300 hover:bg-green-50 text-xs h-7 px-2"
                                onClick={() => handleUserAction(user.id, 'activate')}
                              >
                                <UserCheck className="h-3 w-3 mr-1" />
                                Activate
                              </Button>
                            )}
                            
                            {!user.isEmailVerified && (
                              <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-xs h-7 px-2"
                                onClick={() => handleUserAction(user.id, 'verify')}
                              >
                                <Shield className="h-3 w-3 mr-1" />
                                Verify
                              </Button>
                            )}

                            {/* Delete User Button */}
                            <Dialog open={deleteConfirmOpen === user.id} onOpenChange={(open) => setDeleteConfirmOpen(open ? user.id : null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50 text-xs h-7 px-2"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Delete User</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete <strong>{user.name || user.email}</strong>? This action cannot be undone and will permanently remove all user data including listings, reviews, and community posts.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setDeleteConfirmOpen(null)}
                                    className="w-full sm:w-auto"
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleDeleteUser(user.id)}
                                    disabled={deleting === user.id}
                                    className="w-full sm:w-auto"
                                  >
                                    {deleting === user.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Deleting...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Delete User
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
