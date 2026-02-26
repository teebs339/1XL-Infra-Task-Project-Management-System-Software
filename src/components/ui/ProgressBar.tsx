import { getProgressColor } from '../../utils/helpers';

interface ProgressBarProps {
  progress: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export default function ProgressBar({ progress, size = 'md', showLabel = true, className = '' }: ProgressBarProps) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor(progress)}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-gray-600 w-10 text-right">{progress}%</span>
      )}
    </div>
  );
}
