export default function Loading() {
  return (
    <main className="articlePage" style={{ opacity: 0.7, animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
      <header className="articleTop">
        <div style={{ width: '200px', height: '40px', background: '#e1e5eb', borderRadius: '4px' }} />
        <div style={{ width: '100px', height: '20px', background: '#e1e5eb', borderRadius: '4px' }} />
      </header>
      <div className="articleAdLayout">
        <article style={{ marginTop: '40px' }}>
          <div style={{ width: '80px', height: '15px', background: '#e1e5eb', marginBottom: '20px' }} />
          <div style={{ width: '80%', height: '45px', background: '#e1e5eb', marginBottom: '15px', borderRadius: '4px' }} />
          <div style={{ width: '60%', height: '45px', background: '#e1e5eb', marginBottom: '30px', borderRadius: '4px' }} />
          <div style={{ width: '100%', height: '20px', background: '#e1e5eb', marginBottom: '10px' }} />
          <div style={{ width: '90%', height: '20px', background: '#e1e5eb', marginBottom: '40px' }} />
          
          <div style={{ width: '100%', height: '400px', background: '#e1e5eb', borderRadius: '8px', marginBottom: '40px' }} />
          
          <div style={{ width: '100%', height: '15px', background: '#f4f5f7', marginBottom: '10px' }} />
          <div style={{ width: '100%', height: '15px', background: '#f4f5f7', marginBottom: '10px' }} />
          <div style={{ width: '100%', height: '15px', background: '#f4f5f7', marginBottom: '10px' }} />
          <div style={{ width: '85%', height: '15px', background: '#f4f5f7', marginBottom: '30px' }} />
        </article>
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}} />
    </main>
  );
}
