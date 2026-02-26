import { useState } from 'react';
import { Settings as SettingsIcon, Database, Shield, Bell, Palette, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { currentUser, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saved, setSaved] = useState(false);

  const handleResetData = () => {
    if (confirm('Are you sure you want to reset all data? This will restore the default seed data.')) {
      localStorage.removeItem('tpms_users');
      localStorage.removeItem('tpms_projects');
      localStorage.removeItem('tpms_tasks');
      localStorage.removeItem('tpms_notifications');
      localStorage.removeItem('tpms_activity_logs');
      localStorage.removeItem('tpms_current_user');
      window.location.reload();
    }
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!hasRole(['admin'])) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="text-gray-500 mt-2">You don't have permission to access settings.</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'data', label: 'Data Management', icon: Database },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage application settings and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 flex lg:flex-col gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">General Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Name</label>
                    <input type="text" defaultValue="TaskFlow Pro" className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Project View</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>Card View</option>
                      <option>List View</option>
                      <option>Table View</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Task View</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>List View</option>
                      <option>Board View</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      <option>MMM DD, YYYY</option>
                      <option>DD/MM/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
                  {saved ? 'Saved!' : 'Save Settings'}
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Task assignments', description: 'Notify when a task is assigned to a team member' },
                    { label: 'Deadline reminders', description: 'Send reminders for upcoming deadlines' },
                    { label: 'Status changes', description: 'Notify when a task or project status changes' },
                    { label: 'New comments', description: 'Notify when a new comment is added to a task' },
                    { label: 'Project updates', description: 'Notify when a project is updated' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-indigo-500 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                      </label>
                    </div>
                  ))}
                </div>
                <button onClick={handleSave} className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors">
                  {saved ? 'Saved!' : 'Save Settings'}
                </button>
              </div>
            )}

            {activeTab === 'data' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900">Data Management</h2>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900">Storage Information</h3>
                  <p className="text-sm text-gray-500 mt-1">Data is stored in your browser's localStorage.</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Users</span><span className="font-medium">{JSON.parse(localStorage.getItem('tpms_users') || '[]').length} records</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Projects</span><span className="font-medium">{JSON.parse(localStorage.getItem('tpms_projects') || '[]').length} records</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Tasks</span><span className="font-medium">{JSON.parse(localStorage.getItem('tpms_tasks') || '[]').length} records</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Notifications</span><span className="font-medium">{JSON.parse(localStorage.getItem('tpms_notifications') || '[]').length} records</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Activity Logs</span><span className="font-medium">{JSON.parse(localStorage.getItem('tpms_activity_logs') || '[]').length} records</span></div>
                  </div>
                </div>
                <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                  <h3 className="font-medium text-red-900">Reset Application Data</h3>
                  <p className="text-sm text-red-700 mt-1">This will delete all current data and restore the default seed data. This action cannot be undone.</p>
                  <button
                    onClick={handleResetData}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Reset All Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
