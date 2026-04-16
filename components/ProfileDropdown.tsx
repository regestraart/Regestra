import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogOut, Lock, CreditCard, Award } from 'lucide-react';
import { createUrl } from '../utils';
import { User as UserType } from '../data/mock';

interface ProfileDropdownProps {
  user: UserType;
  onSignOut: () => void;
  onNavigate: () => void;
  onChangePasswordClick: () => void;
}

const rowClass =
  'flex w-full items-center px-4 py-3 text-sm font-semibold text-left hover:bg-gray-50';

const iconCellClass =
  'mr-3 flex h-8 w-8 min-w-[2rem] items-center justify-center self-center';

const labelClass = 'block flex-1 text-left leading-6';
const iconClass = 'h-5 w-5 shrink-0';

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ user, onSignOut, onNavigate, onChangePasswordClick }) => {
  return (
    <div
      className="absolute top-full mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl z-50 animate-zoom-in"
      style={{ minWidth: 220, width: 'max-content', maxWidth: 280, right: 0 }}
    >
      <div className="border-b border-gray-100 px-4 py-3 text-left">
        <p className="truncate text-sm font-bold text-gray-900">{user.name}</p>
        <p className="truncate text-xs text-gray-400">@{user.username}</p>
      </div>

      <div className="py-1">
        <Link
          to={createUrl('/profile/:username', { username: user.username })}
          onClick={onNavigate}
          className={`${rowClass} text-gray-700`}
        >
          <span className={iconCellClass} aria-hidden="true">
            <User className={`${iconClass} text-gray-400`} />
          </span>
          <span className={labelClass}>View Profile</span>
        </Link>

        <Link
          to="/wallet"
          onClick={onNavigate}
          className={`${rowClass} text-gray-700`}
        >
          <span className={iconCellClass} aria-hidden="true">
            <Award className={`${iconClass} text-purple-500`} />
          </span>
          <span className={labelClass}>Regestra Wallet</span>
        </Link>

        <Link
          to="/subscription"
          onClick={onNavigate}
          className={`${rowClass} text-gray-700`}
        >
          <span className={iconCellClass} aria-hidden="true">
            <CreditCard className={`${iconClass} text-gray-400`} />
          </span>
          <span className={labelClass}>Subscription</span>
        </Link>

        <button
          type="button"
          onClick={onChangePasswordClick}
          className={`${rowClass} text-gray-700`}
        >
          <span className={iconCellClass} aria-hidden="true">
            <Lock className={`${iconClass} text-gray-400`} />
          </span>
          <span className={labelClass}>Change Password</span>
        </button>

        <div className="mx-3 my-1 h-px bg-gray-100" />

        <button
          type="button"
          onClick={onSignOut}
          className={`${rowClass} text-red-500 hover:bg-red-50`}
        >
          <span className={iconCellClass} aria-hidden="true">
            <LogOut className={iconClass} />
          </span>
          <span className={labelClass}>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown;
