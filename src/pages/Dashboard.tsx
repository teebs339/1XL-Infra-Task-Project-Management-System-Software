import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban, CheckSquare, AlertTriangle, Users, Clock, TrendingUp,
  ArrowRight, Circle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import StatCard from '../components/ui/StatCard';
import ProgressBar from '../components/ui/ProgressBar';
import { formatDate, formatRelativeTime, formatStatus, isOverdue, getPriorityColor, getTaskStatusColor, getProjectStatusColor } from '../utils/helpers';

const COLORS = ['#6366f1', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function Dashboard() {
  const { currentUser } = useAuth();
  const { projects, tasks, users, activityLogs } = useData();
  const navigate = useNavigate();

  const stats = useMemo(() => {
    const relevantProjects = currentUser?.role === 'team_member'
      ? projects.filter(p => p.teamMemberIds.includes(currentUser.id))
      : currentUser?.role === 'project_manager'
        ? projects.filter(p => p.managerId === currentUser.id)
        : projects;

    const relevantTasks = currentUser?.role === 'team_member'
      ? tasks.filter(t => t.assigneeId === currentUser.id)
      : currentUser?.role === 'project_manager'
        ? tasks.filter(t => {
          const project = projects.find(p => p.id === t.projectId);
          return project?.managerId === currentUser.id;
        })
        : tasks;

    const activeProjCount = relevantProjects.filter(p => p.status === 'in_progress').length;
    const completedTaskCount = relevantTasks.filter(t => t.status === 'completed').length;
    const overdueTaskCount = relevantTasks.filter(t => t.status !== 'completed' && isOverdue(t.dueDate)).length;
    const upcomingDeadlines = relevantTasks.filter(t => {
      const days = Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return t.status !== 'completed' && days >= 0 && days <= 7;
    }).length;

    return {
      totalProjects: relevantProjects.length,
      activeProjects: activeProjCount,
      totalTasks: relevantTasks.length,
      completedTasks: completedTaskCount,
      overdueTasks: overdueTaskCount,
      teamMembers: users.filter(u => u.isActive).length,
      upcomingDeadlines,
      relevantProjects,
      relevantTasks,
    };
  }, [projects, tasks, users, currentUser]);

  // Chart data
  const taskStatusData = useMemo(() => {
    const statusCounts = { todo: 0, in_progress: 0, in_review: 0, completed: 0, blocked: 0 };
    stats.relevantTasks.forEach(t => { statusCounts[t.status]++; });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: formatStatus(status),
      value: count,
    }));
  }, [stats.relevantTasks]);

  const projectProgressData = useMemo(() => {
    return stats.relevantProjects
      .filter(p => p.status !== 'cancelled')
      .slice(0, 6)
      .map(p => ({
        name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
        progress: p.progress,
      }));
  }, [stats.relevantProjects]);

  const weeklyTaskData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, i) => ({
      name: day,
      completed: Math.floor(Math.random() * 5) + 1,
      created: Math.floor(Math.random() * 4) + 1,
    }));
  }, []);

  const recentActivity = useMemo(() => {
    return activityLogs.slice(0, 8);
  }, [activityLogs]);

  const upcomingTasks = useMemo(() => {
    return stats.relevantTasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [stats.relevantTasks]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {currentUser?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your projects and tasks</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<FolderKanban className="w-6 h-6 text-indigo-600" />}
          iconBg="bg-indigo-100"
          label="Total Projects"
          value={stats.totalProjects}
        />
        <StatCard
          icon={<CheckSquare className="w-6 h-6 text-emerald-600" />}
          iconBg="bg-emerald-100"
          label="Completed Tasks"
          value={`${stats.completedTasks}/${stats.totalTasks}`}
        />
        <StatCard
          icon={<AlertTriangle className="w-6 h-6 text-red-600" />}
          iconBg="bg-red-100"
          label="Overdue Tasks"
          value={stats.overdueTasks}
        />
        <StatCard
          icon={<Clock className="w-6 h-6 text-amber-600" />}
          iconBg="bg-amber-100"
          label="Upcoming Deadlines"
          value={stats.upcomingDeadlines}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Task Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={taskStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {taskStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Project Progress Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Project Progress</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                <Tooltip />
                <Bar dataKey="progress" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Weekly Activity Line Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Weekly Task Activity</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTaskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} name="Completed" />
              <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={{ r: 4 }} name="Created" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Upcoming Tasks</h3>
            <button
              onClick={() => navigate('/tasks')}
              className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingTasks.map(task => (
              <div key={task.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOverdue(task.dueDate) ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <p className="text-xs text-gray-500">Due {formatDate(task.dueDate)}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            ))}
            {upcomingTasks.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">No upcoming tasks</div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {recentActivity.map(log => {
              const user = users.find(u => u.id === log.userId);
              return (
                <div key={log.id} className="px-6 py-3 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0 mt-0.5">
                    {user?.avatar || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{user?.name || 'Unknown'}</span>{' '}
                      <span className="text-gray-600">{log.details}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(log.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Projects Overview */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900">Active Projects</h3>
          <button
            onClick={() => navigate('/projects')}
            className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Project</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Team</th>
              </tr>
            </thead>
            <tbody>
              {stats.relevantProjects
                .filter(p => p.status === 'in_progress')
                .map(project => {
                  const manager = users.find(u => u.id === project.managerId);
                  return (
                    <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Manager: {manager?.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                          {formatStatus(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 w-48">
                        <ProgressBar progress={project.progress} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(project.endDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex -space-x-2">
                          {project.teamMemberIds.slice(0, 3).map(id => {
                            const member = users.find(u => u.id === id);
                            return (
                              <div key={id} className="w-7 h-7 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-bold text-indigo-700" title={member?.name}>
                                {member?.avatar || '?'}
                              </div>
                            );
                          })}
                          {project.teamMemberIds.length > 3 && (
                            <div className="w-7 h-7 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                              +{project.teamMemberIds.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
