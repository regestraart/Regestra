import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { createPageUrl } from '../utils';
import { User as UserType } from '../data/mock';

interface ProfileDropdownProps {
  user: UserType;
  onSignOut: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onSignOut }) => {
  return (
    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
      <div className="p-4 border-b border-gray-200">
        <p className="font-semibold text-gray-900 truncate">{user.name}</p>
        <p className="text-sm text-gray-500 truncate">@{user.username}</p>
      </div>
      <div className="py-2">
        <Link 
          to={createPageUrl('Profile', { userId: user.id })} 
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <User className="w-4 h-4 mr-3" />
          View Profile
        </Link>
        <button 
          onClick={onSignOut}
          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
