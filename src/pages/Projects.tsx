import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, FolderKanban, Calendar, DollarSign, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Modal from '../components/ui/Modal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import type { Project, ProjectStatus, TaskPriority } from '../types';
import { formatDate, formatStatus, getProjectStatusColor, getPriorityColor, formatCurrency } from '../utils/helpers';

export default function Projects() {
  const { currentUser, hasRole } = useAuth();
  const { projects, users, tasks, addProject, updateProject, deleteProject, addActivityLog } = useData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    status: 'not_started' as ProjectStatus,
    priority: 'medium' as TaskPriority,
    startDate: '',
    endDate: '',
    managerId: '',
    teamMemberIds: [] as string[],
    budget: 0,
    tags: '',
  });

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (currentUser?.role === 'team_member') {
      result = result.filter(p => p.teamMemberIds.includes(currentUser.id));
    } else if (currentUser?.role === 'project_manager') {
      result = result.filter(p => p.managerId === currentUser.id || p.teamMemberIds.includes(currentUser.id));
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return result.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [projects, currentUser, statusFilter, searchQuery]);

  const projectManagers = users.filter(u => u.role === 'project_manager' || u.role === 'admin');
  const teamMembers = users.filter(u => u.isActive);

  const resetForm = () => {
    setForm({
      name: '',
      description: '',
      status: 'not_started',
      priority: 'medium',
      startDate: '',
      endDate: '',
      managerId: currentUser?.role === 'project_manager' ? currentUser.id : '',
      teamMemberIds: [],
      budget: 0,
      tags: '',
    });
  };

  const openCreate = () => {
    resetForm();
    setEditProject(null);
    setShowCreateModal(true);
  };

  const openEdit = (project: Project) => {
    setForm({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      managerId: project.managerId,
      teamMemberIds: project.teamMemberIds,
      budget: project.budget,
      tags: project.tags.join(', '),
    });
    setEditProject(project);
    setShowCreateModal(true);
    setOpenMenu(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const projectData = {
      name: form.name,
      description: form.description,
      status: form.status,
      priority: form.priority,
      startDate: form.startDate,
      endDate: form.endDate,
      managerId: form.managerId,
      teamMemberIds: form.teamMemberIds,
      budget: form.budget,
      progress: editProject?.progress || 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
    };

    if (editProject) {
      updateProject(editProject.id, projectData);
      addActivityLog({
        userId: currentUser!.id,
        action: 'updated',
        entityType: 'project',
        entityId: editProject.id,
        details: `Updated project "${form.name}"`,
      });
    } else {
      const newProject = addProject(projectData);
      addActivityLog({
        userId: currentUser!.id,
        action: 'created',
        entityType: 'project',
        entityId: newProject.id,
        details: `Created new project "${form.name}"`,
      });
    }
    setShowCreateModal(false);
  };

  const handleDelete = (id: string) => {
    const project = projects.find(p => p.id === id);
    deleteProject(id);
    addActivityLog({
      userId: currentUser!.id,
      action: 'deleted',
      entityType: 'project',
      entityId: id,
      details: `Deleted project "${project?.name}"`,
    });
    setDeleteConfirm(null);
  };

  const toggleTeamMember = (userId: string) => {
    setForm(prev => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(userId)
        ? prev.teamMemberIds.filter(id => id !== userId)
        : [...prev.teamMemberIds, userId],
    }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500 mt-1">{filteredProjects.length} projects</p>
        </div>
        {hasRole(['admin', 'project_manager']) && (
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> New Project
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">All Status</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Project Cards */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderKanban className="w-8 h-8" />}
          title="No projects found"
          description="Create a new project or adjust your filters."
          action={
            hasRole(['admin', 'project_manager']) ? (
              <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600">
                <Plus className="w-4 h-4" /> Create Project
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map(project => {
            const manager = users.find(u => u.id === project.managerId);
            const taskCount = tasks.filter(t => t.projectId === project.id).length;
            const completedTaskCount = tasks.filter(t => t.projectId === project.id && t.status === 'completed').length;

            return (
              <div key={project.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-semibold text-gray-900 truncate cursor-pointer hover:text-indigo-600" onClick={() => navigate(`/projects/${project.id}`)}>
                        {project.name}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
                    </div>
                    {hasRole(['admin', 'project_manager']) && (
                      <div className="relative">
                        <button
                          onClick={() => setOpenMenu(openMenu === project.id ? null : project.id)}
                          className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {openMenu === project.id && (
                          <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-36 z-20">
                            <button onClick={() => navigate(`/projects/${project.id}`)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="w-4 h-4" /> View
                            </button>
                            <button onClick={() => openEdit(project)} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteConfirm(project.id); setOpenMenu(null); }} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                      {formatStatus(project.status)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority}
                    </span>
                  </div>

                  <ProgressBar progress={project.progress} size="sm" className="mb-3" />

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(project.endDate)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{formatCurrency(project.budget)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                      {manager?.avatar || '?'}
                    </div>
                    <span className="text-xs text-gray-500">{manager?.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{completedTaskCount}/{taskCount} tasks</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={editProject ? 'Edit Project' : 'Create New Project'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Enter project name" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Describe the project..." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form, status: e.target.value as ProjectStatus})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value as TaskPriority})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
              <input type="date" required value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
              <input type="date" required value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager *</label>
              <select required value={form.managerId} onChange={e => setForm({...form, managerId: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                <option value="">Select manager</option>
                {projectManagers.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
              <input type="number" min={0} value={form.budget} onChange={e => setForm({...form, budget: Number(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Members</label>
            <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-lg max-h-32 overflow-y-auto">
              {teamMembers.map(user => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleTeamMember(user.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.teamMemberIds.includes(user.id)
                      ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {user.avatar} {user.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
            <input type="text" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="frontend, backend, design (comma separated)" />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              {editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Delete Project"
        message="Are you sure you want to delete this project? All associated tasks will also be deleted. This action cannot be undone."
        confirmText="Delete"
      />
    </div>
  );
}
