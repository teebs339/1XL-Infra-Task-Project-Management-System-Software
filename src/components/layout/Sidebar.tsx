import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Users,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'project_manager', 'team_member'] },
  { name: 'Projects', href: '/projects', icon: FolderKanban, roles: ['admin', 'project_manager', 'team_member'] },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, roles: ['admin', 'project_manager', 'team_member'] },
  { name: 'Team', href: '/team', icon: Users, roles: ['admin', 'project_manager'] },
  { name: 'Progress', href: '/progress', icon: BarChart3, roles: ['admin', 'project_manager', 'team_member'] },
  { name: 'Reports', href: '/reports', icon: FileText, roles: ['admin', 'project_manager'] },
  { name: 'Notifications', href: '/notifications', icon: Bell, roles: ['admin', 'project_manager', 'team_member'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin'] },
];

export default function Sidebar() {
  const { currentUser, logout } = useAuth();
  const { getUnreadCount } = useData();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const unreadCount = currentUser ? getUnreadCount(currentUser.id) : 0;

  const filteredNav = navigation.filter(item =>
    currentUser && item.roles.includes(currentUser.role)
  );

  return (
    <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-slate-900 text-white flex flex-col transition-all duration-300 h-full`}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <FolderKanban className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight whitespace-nowrap">TaskFlow Pro</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
              {item.name === 'Notifications' && unreadCount > 0 && (
                <span className={`${collapsed ? 'absolute -top-1 -right-1' : 'ml-auto'} bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User info + collapse */}
      <div className="border-t border-slate-700/50 p-3">
        {!collapsed && currentUser && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-white/5 hover:text-red-400 transition-colors w-full"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}
