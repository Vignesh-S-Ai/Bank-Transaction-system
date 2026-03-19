
// ── Card Skeletons ────────────────────────────────────
const MetricSkeleton = () => (
    <div className="card" style={{ padding: '1.25rem' }}>
        <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        <div className="skeleton" style={{ height: '2rem', width: '60%', margin: '0.75rem 0' }} />
        <div className="skeleton skeleton-text" style={{ width: '50%' }} />
    </div>
);

const TxRowSkeleton = () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
        <div className="skeleton skeleton-avatar" />
        <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-line" style={{ width: '45%', marginBottom: '0.4rem' }} />
            <div className="skeleton skeleton-line" style={{ width: '30%' }} />
        </div>
        <div className="skeleton skeleton-line" style={{ width: '15%' }} />
    </div>
);

// ── Dashboard Skeleton ────────────────────────────────────
export const DashboardSkeleton = () => (
    <div className="dashboard-page">
        <div style={{ marginBottom: '2rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '30%' }} />
            <div className="skeleton skeleton-text" style={{ width: '20%' }} />
        </div>
        <div className="dashboard-metrics-grid" style={{ marginBottom: '1.5rem' }}>
            {[...Array(4)].map((_, i) => <MetricSkeleton key={i} />)}
        </div>
        <div className="dashboard-main-grid">
            <div className="card">
                {[...Array(5)].map((_, i) => <TxRowSkeleton key={i} />)}
            </div>
            <div className="card" style={{ padding: '1.25rem' }}>
                <div className="skeleton skeleton-title" style={{ width: '50%', marginBottom: '1rem' }} />
                {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'center' }}>
                        <div className="skeleton" style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                            <div className="skeleton skeleton-line" style={{ width: '50%', marginBottom: '0.35rem' }} />
                            <div className="skeleton skeleton-line" style={{ width: '35%' }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

// ── Transactions Skeleton ────────────────────────────────────
export const TransactionsSkeleton = () => (
    <div className="transactions-page">
        <div style={{ marginBottom: '2rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '25%' }} />
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
        </div>
        <div className="transactions-grid">
            <div className="card" style={{ padding: '1.5rem' }}>
                <div className="skeleton skeleton-card" style={{ marginBottom: '1rem' }} />
                <div className="skeleton" style={{ height: '3rem', width: '100%', borderRadius: 8 }} />
            </div>
            <div className="card">
                {[...Array(8)].map((_, i) => <TxRowSkeleton key={i} />)}
            </div>
        </div>
    </div>
);

export default DashboardSkeleton;
