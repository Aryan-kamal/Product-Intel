import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'No data found',
  message = 'Get started by uploading a product video or CSV.',
  action,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-16 h-16 bg-white/[0.04] border border-white/[0.06] rounded-2xl flex items-center justify-center mb-5">
        {icon || <Inbox className="w-8 h-8 text-gray-600" />}
      </div>
      <h3 className="text-base font-semibold text-gray-300 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 text-center max-w-sm">{message}</p>
      {action}
    </div>
  );
}
