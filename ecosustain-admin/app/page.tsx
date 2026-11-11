import Link from 'next/link';

// Naya page banayein to yahan sirf ek line add kar dein
const pages = [
  { name: 'Admin Login', href: '/login' },
  { name: 'Forgot Password', href: '/forgot-password' },
  { name: 'Report Waste (user)', href: '/report?bin=BIN-014' },
];

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: '#faf7ee', padding: 32, fontFamily: 'system-ui, sans-serif', color: '#0b2418' }}>
      <h1 style={{ margin: '0 0 8px' }}>EcoSustain Campus</h1>
      <p style={{ margin: '0 0 24px', color: '#4d5b52' }}>All pages (for development)</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420 }}>
        {pages.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            style={{ padding: '16px 20px', background: '#0a4228', color: '#fff', borderRadius: 16, textDecoration: 'none', fontWeight: 700 }}
          >
            {p.name}
          </Link>
        ))}
      </div>
    </main>
  );
}