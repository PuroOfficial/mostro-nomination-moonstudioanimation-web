import { useState, useEffect } from 'react';

const MaintenanceRedirect = () => {
    const [isMaintenance, setIsMaintenance] = useState(false);

    useEffect(() => {
        checkMaintenanceMode();
    }, []);

    const checkMaintenanceMode = async () => {
        try {
            const response = await fetch('/api/check-maintenance');
            const data = await response.json();

            if (data.maintenance && typeof window !== 'undefined') {
                setIsMaintenance(true);
                // Redirect to maintenance page
                window.location.href = '/maintenance';
            }
        } catch (error) {
            console.error('Error checking maintenance mode:', error);
        }
    };

    return null; // This component doesn't render anything
};

export default MaintenanceRedirect;