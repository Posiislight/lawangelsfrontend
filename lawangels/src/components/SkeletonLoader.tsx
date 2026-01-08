/**
 * Reusable Skeleton Loader Components
 * Provides shimmer loading states for various page layouts
 */

interface SkeletonProps {
    className?: string;
}

// Base skeleton block with shimmer animation
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer bg-[length:200%_100%] rounded ${className}`}
        />
    );
}

// Card skeleton for course/topic cards
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Skeleton className="w-6 h-6" />
                        <Skeleton className="h-4 flex-1" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                ))}
            </div>
        </div>
    );
}

// Video course card skeleton
export function VideoCourseCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

// Flashcard deck skeleton
export function FlashcardDeckSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-28 mb-1" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </div>
            <Skeleton className="h-2 w-full rounded-full mb-2" />
            <Skeleton className="h-3 w-24" />
        </div>
    );
}

// Quiz topic skeleton
export function QuizTopicSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
        </div>
    );
}

// Page skeleton with header
interface PageSkeletonProps {
    title?: string;
    children: React.ReactNode;
}

export function PageSkeleton({ title = 'Loading...', children }: PageSkeletonProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Header skeleton */}
            <div className="mb-8">
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-96" />
            </div>

            {children}

            {/* Loading indicator */}
            <div className="flex items-center justify-center gap-3 mt-8 text-gray-500">
                <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">{title}</span>
            </div>

            <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
        </div>
    );
}

export default Skeleton;
