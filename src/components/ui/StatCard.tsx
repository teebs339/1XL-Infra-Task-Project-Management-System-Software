import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
}

export default function StatCard({ icon, iconBg, label, value, change }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={`text-xs font-medium ${change.positive ? 'text-emerald-600' : 'text-red-600'}`}>
            {change.positive ? '↑' : '↓'} {change.value}
          </p>
        )}
      </div>
    </div>
  );
}
