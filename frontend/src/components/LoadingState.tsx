import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-white/[0.06]" />
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 absolute inset-0" />
      </div>
      <p className="text-sm mt-4 text-gray-500 font-medium">{message}</p>
    </div>
  );
}
