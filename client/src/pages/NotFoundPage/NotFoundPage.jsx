export function NotFoundPage() {
  return (
    <div style={{ padding: '40px', display: 'flex', gap: '40px', alignItems: 'center' }}>
      <div>
        <img
          src="/login-preview.png"
          alt="Preview"
          style={{ width: '250px' }}
        />
      </div>

      <div>
        <h1>Oops! Page Not Found (404 Error)</h1>
        <p>
          We’re sorry, but the page you’re looking for doesn’t seem to exist.
        </p>
        <p>
          If you typed the URL manually, please double-check the spelling.
          If you clicked on a link, it may be outdated or broken.
        </p>
      </div>
    </div>
  );
}