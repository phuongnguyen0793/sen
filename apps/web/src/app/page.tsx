import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', color: 'var(--green)', marginBottom: '0.5rem' }}>Sen</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--muted)', maxWidth: 480, margin: '0 auto 2rem' }}>
        Nhắc ăn chay đúng ngày âm — mùng 1, rằm, và ngày bạn chọn.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/login" className="btn">
          Đăng nhập
        </Link>
        <Link href="/app" className="btn" style={{ background: '#40916c' }}>
          Mở ứng dụng web
        </Link>
      </div>
      <p style={{ marginTop: '3rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
        Lunar Fasting Companion — Vietnam-first, English coming soon.
      </p>
    </main>
  );
}
