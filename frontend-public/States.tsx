import './States.css';

export function Skeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-list" aria-label="Loading entries…">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-line skeleton-line--sm" />
          <div className="skeleton-line skeleton-line--title" />
          <div className="skeleton-line" />
          <div className="skeleton-line skeleton-line--short" />
        </div>
      ))}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <span className="error-icon">⚠</span>
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({ message = 'No entries found.' }: { message?: string }) {
  return (
    <div className="empty-state">
      <p>{message}</p>
    </div>
  );
}
