import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn("animate-spin rounded-full border-2 border-primary/20 border-t-primary", sizeClasses[size], className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 space-y-4 bg-card rounded-lg border animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-4 bg-muted rounded w-1/3 shimmer"></div>
        <div className="h-4 w-4 bg-muted rounded shimmer"></div>
      </div>
      <div className="h-8 bg-muted rounded w-1/2 shimmer"></div>
      <div className="h-3 bg-muted rounded w-3/4 shimmer"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 shimmer"></div>
          <div className="h-4 bg-muted rounded w-1/3 shimmer"></div>
          <div className="h-4 bg-muted rounded w-1/5 shimmer"></div>
          <div className="h-4 bg-muted rounded w-1/6 shimmer"></div>
        </div>
      ))}
    </div>
  );
}