
import React, { useState, useEffect } from 'react';
import { getAllUsers, User } from '../data/mock';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Shield, Lock, LogOut, Search, Mail, User as UserIcon, AlertTriangle, Settings, CheckCircle, ArrowLeft, Save } from 'lucide-react';

export default function Admin() {
  // --- Admin State Management ---
  // Initialize from LocalStorage or defaults
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem('admin_email') || 'egolden@regestra.com');
  const [adminPass, setAdminPass] = useState(() => localStorage.getItem('admin_password') || 'admin123');

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Email, 2: New Pass
  
  // Login Inputs
  const [inputEmail, setInputEmail] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Dashboard State
  const [activeTab, setActiveTab] = useState<'users' | 'settings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Settings Inputs
  const [settingsEmail, setSettingsEmail] = useState(adminEmail);
  const [settingsPass, setSettingsPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  useEffect(() => {
    // Sync state if localStorage changes externally (optional, but good for consistency)
    localStorage.setItem('admin_email', adminEmail);
    localStorage.setItem('admin_password', adminPass);
  }, [adminEmail, adminPass]);

  // --- Handlers ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputEmail.toLowerCase() === adminEmail.toLowerCase() && inputPass === adminPass) {
      setIsAuthenticated(true);
      setUsers(getAllUsers());
      setSettingsEmail(adminEmail); // Pre-fill settings
      setError('');
      setInputPass(''); // Clear password from state
    } else {
      setError('Invalid email or password. Access denied.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setInputEmail('');
    setInputPass('');
    setActiveTab('users');
  };

  const handleUpdateSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!settingsEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    // Update Email
    setAdminEmail(settingsEmail);

    // Update Password if provided
    if (settingsPass) {
      if (settingsPass !== confirmPass) {
        setError('Passwords do not match.');
        return;
      }
      if (settingsPass.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setAdminPass(settingsPass);
    }

    setSuccessMsg('Admin settings updated successfully.');
    setSettingsPass('');
    setConfirmPass('');
    
    // Hide success message after 3 seconds
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (resetStep === 1) {
      // Verify Email
      if (inputEmail.toLowerCase() === adminEmail.toLowerCase()) {
        setResetStep(2);
        setError('');
      } else {
        setError('Email address not found.');
      }
    } else {
      // Set New Password
      if (inputPass.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      setAdminPass(inputPass);
      setSuccessMsg('Password reset successfully. Please log in.');
      setTimeout(() => {
        setIsResettingPassword(false);
        setResetStep(1);
        setSuccessMsg('');
        setInputPass('');
      }, 2000);
    }
  };

  // --- Views ---

  if (isResettingPassword) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Reset Admin Password</h1>
            <p className="text-gray-600 mt-2">
              {resetStep === 1 ? "Enter your admin email to continue." : "Create a new password."}
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-red-100">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center gap-2 text-sm border border-green-100">
                <CheckCircle className="w-4 h-4" />
                {successMsg}
              </div>
            )}

            {resetStep === 1 ? (
              <div className="space-y-2">
                <Label htmlFor="reset-email">Admin Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    id="reset-email" 
                    type="email" 
                    required 
                    className="pl-10 h-12" 
                    value={inputEmail} 
                    onChange={e => setInputEmail(e.target.value)} 
                    placeholder="egolden@regestra.com"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input 
                    id="new-password" 
                    type="password" 
                    required 
                    className="pl-10 h-12" 
                    value={inputPass} 
                    onChange={e => setInputPass(e.target.value)} 
                    placeholder="New secure password"
                  />
                </div>
              </div>
            )}
            
            <Button type="submit" className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold">
              {resetStep === 1 ? "Verify Email" : "Update Password"}
            </Button>

            <div className="text-center">
              <button 
                type="button"
                onClick={() => { setIsResettingPassword(false); setResetStep(1); setError(''); }}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

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
              <Label htmlFor="username">Admin Email</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="username" 
                  type="email" 
                  required 
                  className="pl-10 h-12" 
                  value={inputEmail} 
                  onChange={e => setInputEmail(e.target.value)}
                  placeholder="Enter admin email" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button 
                  type="button" 
                  onClick={() => { setIsResettingPassword(true); setError(''); }}
                  className="text-xs text-purple-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="pl-10 h-12" 
                  value={inputPass} 
                  onChange={e => setInputPass(e.target.value)} 
                  placeholder="Enter password"
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

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-gray-900 text-white px-6 py-4 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-400" />
            <h1 className="text-xl font-bold">Regestra Admin</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 hidden sm:inline">Logged in as {adminEmail}</span>
            <Button variant="outline-light" size="sm" onClick={handleLogout} className="border-gray-600 hover:bg-gray-800">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'users' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <UserIcon className="w-4 h-4" />
            Users Database
            {activeTab === 'users' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`pb-4 px-2 font-medium text-sm flex items-center gap-2 transition-colors relative ${activeTab === 'settings' ? 'text-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings className="w-4 h-4" />
            Admin Settings
            {activeTab === 'settings' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600 rounded-t-full"></span>}
          </button>
        </div>

        {activeTab === 'users' ? (
          <div className="animate-fade-in">
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
        ) : (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Admin Credentials
              </h2>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm mb-6 border border-red-100">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 text-sm mb-6 border border-green-100">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleUpdateSettings} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input 
                      id="admin-email" 
                      type="email" 
                      value={settingsEmail} 
                      onChange={(e) => setSettingsEmail(e.target.value)} 
                      className="pl-10 h-12"
                    />
                  </div>
                  <p className="text-xs text-gray-500">This email is used to log in to the admin panel.</p>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Change Password</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-pass">New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="new-pass" 
                          type="password" 
                          value={settingsPass} 
                          onChange={(e) => setSettingsPass(e.target.value)} 
                          className="pl-10 h-12"
                          placeholder="Leave empty to keep current password"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-pass">Confirm New Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input 
                          id="confirm-pass" 
                          type="password" 
                          value={confirmPass} 
                          onChange={(e) => setConfirmPass(e.target.value)} 
                          className="pl-10 h-12"
                          placeholder="Confirm new password"
                          disabled={!settingsPass}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white px-8 rounded-xl">
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
