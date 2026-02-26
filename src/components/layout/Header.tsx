import { Bell, Search, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { currentUser } = useAuth();
  const { getUnreadCount } = useData();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-64 lg:w-80 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
        {currentUser && (
          <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold text-white">
              {currentUser.avatar}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
