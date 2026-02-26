import { useState, useMemo } from 'react';
import { Plus, Search, Users, Mail, Phone, Calendar, Briefcase, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import type { User, UserRole } from '../types';
import { formatDate } from '../utils/helpers';

export default function Team() {
  const { currentUser, hasRole } = useAuth();
  const { users, tasks, projects, addUser, updateUser, deleteUser, addActivityLog } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const emptyForm = {
    name: '',
    email: '',
    password: '',
    role: 'team_member' as UserRole,
    department: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  const filteredUsers = useMemo(() => {
    let result = users;
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [users, roleFilter, searchQuery]);

  const getUserStats = (userId: string) => {
    const userTasks = tasks.filter(t => t.assigneeId === userId);
    const completedTasks = userTasks.filter(t => t.status === 'completed').length;
    const activeTasks = userTasks.filter(t => t.status === 'in_progress').length;
    const userProjects = projects.filter(p => p.teamMemberIds.includes(userId) || p.managerId === userId);
    const totalHours = userTasks.reduce((sum, t) => sum + t.loggedHours, 0);
    return { totalTasks: userTasks.length, completedTasks, activeTasks, projectCount: userProjects.length, totalHours };
  };

  const openCreate = () => {
    setForm(emptyForm);
    setEditUser(null);
    setShowCreateModal(true);
  };

  const openEdit = (user: User) => {
    setForm({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      phone: user.phone,
      joinDate: user.joinDate,
      isActive: user.isActive,
    });
    setEditUser(user);
    setShowCreateModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = form.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    if (editUser) {
      const updateData: Partial<User> = {
        name: form.name,
        email: form.email,
        role: form.role,
        avatar: initials,
        department: form.department,
        phone: form.phone,
        joinDate: form.joinDate,
        isActive: form.isActive,
      };
      if (form.password) updateData.password = form.password;
      updateUser(editUser.id, updateData);
      addActivityLog({
        userId: currentUser!.id,
        action: 'updated',
        entityType: 'user',
        entityId: editUser.id,
        details: `Updated user "${form.name}"`,
      });
    } else {
      const newUser = addUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        avatar: initials,
        department: form.department,
        phone: form.phone,
        joinDate: form.joinDate,
        isActive: form.isActive,
      });
      addActivityLog({
        userId: currentUser!.id,
        action: 'created',
        entityType: 'user',
        entityId: newUser.id,
        details: `Added new team member "${form.name}"`,
      });
    }
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    const user = users.find(u => u.id === id);
    deleteUser(id);
    addActivityLog({
      userId: currentUser!.id,
      action: 'deleted',
      entityType: 'user',
      entityId: id,
      details: `Removed user "${user?.name}"`,
    });
    setDeleteConfirm(null);
    if (viewUser?.id === id) setViewUser(null);
  };

  const toggleUserActive = (user: User) => {
    updateUser(user.id, { isActive: !user.isActive });
    addActivityLog({
      userId: currentUser!.id,
      action: 'updated',
      entityType: 'user',
      entityId: user.id,
      details: `${user.isActive ? 'Deactivated' : 'Activated'} user "${user.name}"`,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-500 mt-1">{filteredUsers.length} members</p>
        </div>
        {hasRole(['admin']) && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search team members..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="project_manager">Project Manager</option>
          <option value="team_member">Team Member</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState icon={<Users className="w-8 h-8" />} title="No team members found" description="Add a new member or adjust your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map(user => {
            const stats = getUserStats(user.id);
            return (
              <div key={user.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${user.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-500'}`}>
                        {user.avatar}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {user.name}
                          {!user.isActive && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Inactive</span>}
                        </h3>
                        <p className="text-sm text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                    {hasRole(['admin']) && user.id !== currentUser?.id && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleUserActive(user)} className={`p-1.5 rounded-lg ${user.isActive ? 'text-gray-400 hover:bg-amber-50 hover:text-amber-600' : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`} title={user.isActive ? 'Deactivate' : 'Activate'}>
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                        <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><span className="truncate">{user.email}</span></div>
                    <div className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400" /><span>{user.department}</span></div>
                    <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><span>{user.phone}</span></div>
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /><span>Joined {formatDate(user.joinDate)}</span></div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{stats.projectCount}</p>
                      <p className="text-xs text-gray-500">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-gray-900">{stats.totalTasks}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-emerald-600">{stats.completedTasks}</p>
                      <p className="text-xs text-gray-500">Completed</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{stats.totalHours}h logged</span>
                    <span>{stats.activeTasks} active tasks</span>
                  </div>
                  {stats.totalTasks > 0 && (
                    <ProgressBar progress={Math.round((stats.completedTasks / stats.totalTasks) * 100)} size="sm" className="mt-2" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title={editUser ? 'Edit Team Member' : 'Add Team Member'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="john@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
            <input type="password" required={!editUser} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <select required value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="team_member">Team Member</option>
                <option value="project_manager">Project Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <input type="text" required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Engineering" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
              <input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500" />
            <label htmlFor="isActive" className="text-sm text-gray-700">Active account</label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600">{editUser ? 'Update Member' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)} title="Remove Team Member" message="Are you sure you want to remove this team member? This action cannot be undone." confirmText="Remove" />
    </div>
  );
}
