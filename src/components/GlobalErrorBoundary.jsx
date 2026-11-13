import React from 'react';
import { AlertTriangle, RefreshCw, Home, Copy, Check } from 'lucide-react';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, error can be sent to telemetry logger or Sentry
    console.error('[TravelOps Global Error Boundary]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleCopyError = () => {
    const errorText = `TravelOps Error Report
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error?.toString()}
Component Stack: ${this.state.errorInfo?.componentStack || 'N/A'}`;

    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2500);
    }).catch(() => {});
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'radial-gradient(ellipse at top, #0f172a 0%, #030712 100%)',
            color: '#f8fafc',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '620px',
              width: '100%',
              background: '#0b1329',
              border: '1.5px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              padding: '36px 32px',
              boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.25)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '70px',
                height: '70px',
                borderRadius: '20px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px auto',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <AlertTriangle size={36} />
            </div>

            <span
              style={{
                display: 'inline-block',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '11px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '4px 12px',
                borderRadius: '20px',
                marginBottom: '12px',
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              Sistem Recovery &bull; Error Terisolasi
            </span>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: '800',
                margin: '0 0 10px 0',
                color: '#f8fafc'
              }}
            >
              Terjadi Kendala Teknis Tak Terduga
            </h2>

            <p
              style={{
                fontSize: '0.92rem',
                lineHeight: '1.6',
                color: '#94a3b8',
                margin: '0 0 24px 0'
              }}
            >
              Komponen aplikasi mengalami galat saat memuat data atau antarmuka. 
              Data Anda di server tetap aman. Anda dapat memuat ulang halaman atau kembali ke dashboard utama.
            </p>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  padding: '11px 22px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.3)'
                }}
              >
                <RefreshCw size={16} />
                Muat Ulang Halaman
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  padding: '11px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer'
                }}
              >
                <Home size={16} />
                Ke Dashboard Utama
              </button>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid #1e293b', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={this.toggleDetails}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {this.state.showDetails ? 'Sembunyikan Rincian Teknis' : 'Tampilkan Rincian Teknis'}
                </button>

                <button
                  type="button"
                  onClick={this.handleCopyError}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: this.state.copied ? '#10b981' : '#64748b',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {this.state.copied ? <Check size={12} /> : <Copy size={12} />}
                  {this.state.copied ? 'Tersalin!' : 'Salin Laporan Error'}
                </button>
              </div>

              {this.state.showDetails && (
                <div
                  style={{
                    marginTop: '14px',
                    textAlign: 'left',
                    background: '#030712',
                    border: '1px solid #1e293b',
                    borderRadius: '10px',
                    padding: '14px',
                    fontSize: '11px',
                    color: '#f87171',
                    fontFamily: 'Consolas, monospace',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {this.state.error?.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
