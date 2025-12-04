import React from 'react';

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 pb-3 border-b-2 transition-colors whitespace-nowrap ${active ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
    >
        {icon} {label}
    </button>
);

export default TabButton;
