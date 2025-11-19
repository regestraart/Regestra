
import React, { useState } from 'react';
import { getAllUsers, User } from '../data/mock';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Shield, Lock, LogOut, Search, Mail, User as UserIcon, AlertTriangle } from 'lucide-react';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Hardcoded Admin Credentials for Prototype
  const ADMIN_USER = 'admin';
  const ADMIN_PASS = 'admin123';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      setUsers(getAllUsers());
      setError('');
    } else {
      setError('Invalid credentials. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsername('');
    setPassword('');
    setUsers([]);
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Access</h1>
            <p className="text-gray-600 mt-2">Restricted area. Authorized personnel only.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Admin Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="username" 
                  type="text" 
                  required 
                  className="pl-10 h-12" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="pl-10 h-12" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
              </div>
            </div>
            
            <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold">
              Access Dashboard
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white px-6 py-4 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Regestra Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">Logged in as Admin</span>
            <Button variant="outline-light" size="sm" onClick={handleLogout} className="border-gray-600 hover:bg-gray-800">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Database</h2>
            <p className="text-gray-600">Total Users: {users.length}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search by email or name..." 
              className="pl-9 bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
                  <th className="px-6 py-4">User Profile</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Email Address</th>
                  <th className="px-6 py-4">Joined</th>
                  <th className="px-6 py-4">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover bg-gray-100" />
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'artist' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {user.role === 'artist' ? 'Artist' : 'Art Lover'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${user.email}`} className="hover:text-purple-600 hover:underline">
                          {user.email}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.joinDate}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="flex gap-3">
                        <div className="text-center">
                          <span className="block font-bold text-gray-900">{user.stats.followers}</span>
                          <span className="text-[10px] uppercase">Followers</span>
                        </div>
                        {user.role === 'artist' && (
                           <div className="text-center">
                              <span className="block font-bold text-gray-900">{user.stats.artworks || 0}</span>
                              <span className="text-[10px] uppercase">Arts</span>
                           </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No users found matching "{searchQuery}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
