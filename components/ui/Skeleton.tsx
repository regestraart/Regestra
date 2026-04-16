
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={`shimmer bg-gray-200 rounded-lg ${className}`} />
  );
};

export const PostSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="w-1/3 h-4" />
        <Skeleton className="w-1/4 h-3" />
      </div>
    </div>
    <Skeleton className="w-full h-4" />
    <Skeleton className="w-5/6 h-4" />
    <Skeleton className="w-full h-40" />
  </div>
);

export const ArtworkSkeleton = () => (
  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-white border border-gray-100">
    <Skeleton className="w-full h-full" />
  </div>
);
