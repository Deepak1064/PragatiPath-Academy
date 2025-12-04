import React from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';

const NetworkStatusBanner = ({ currentIP, allowedSchoolIP, refreshIP }) => {
    const isConnected = allowedSchoolIP && currentIP === allowedSchoolIP;

    return (
        <div className={`rounded-xl p-4 flex items-center justify-between shadow-sm border ${isConnected ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
            }`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isConnected ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                    {isConnected ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                    <h3 className={`font-semibold text-sm ${isConnected ? 'text-green-800' : 'text-amber-800'
                        }`}>
                        {isConnected ? 'Connected to School WiFi' : 'Wrong Network'}
                    </h3>
                    <p className="text-xs text-gray-500">
                        {isConnected ? 'Ready to mark attendance' : 'Connect to School WiFi to continue'}
                    </p>
                </div>
            </div>
            <button onClick={refreshIP} className="text-gray-400 hover:text-blue-600">
                <Loader2 className="w-4 h-4" />
            </button>
        </div>
    );
};

export default NetworkStatusBanner;
