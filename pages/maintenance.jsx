// pages/maintenance.js
import Head from 'next/head';

export default function MaintenancePage() {
    return (
        <div style={{
            fontFamily: 'Times New Roman, serif',
            backgroundColor: 'white',
            color: 'black',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            textAlign: 'center'
        }}>
            <Head>
                <title>Maintenance Mode</title>
            </Head>

            <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                Maintenance Mode
            </h1>

            <p style={{ fontSize: '1.2rem', marginBottom: '2rem' }}>
                The site is currently undergoing maintenance. Please check back later.
            </p>

            <div style={{ fontSize: '1rem', color: '#666' }}>
                <p>Moon Studio Animation</p>
                <p>We'll be back soon!</p>
            </div>

            <script
                dangerouslySetInnerHTML={{
                    __html: `
            // Auto-check every 5 minutes if maintenance is over
            setInterval(function() {
              fetch('/api/check-maintenance')
                .then(response => response.json())
                .then(data => {
                  if (!data.maintenance) {
                    window.location.href = '/';
                  }
                });
            }, 300000);
          `
                }}
            />
        </div>
    );
}