import { useState, useCallback } from 'react';

export const useIPAddress = () => {
    const [currentIP, setCurrentIP] = useState(null);

    const fetchIP = useCallback(async () => {
        try {
            // Check for mocked IP first (for testing)
            const mockIP = localStorage.getItem('mock_current_ip');
            if (mockIP) {
                setCurrentIP(mockIP);
                return;
            }

            // Fetch real IP from API
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            setCurrentIP(data.ip);
        } catch (error) {
            console.error("Failed to fetch IP", error);
        }
    }, []);

    return { currentIP, fetchIP };
};
