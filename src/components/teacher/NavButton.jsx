import React from 'react';

const NavButton = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
    >
        {React.cloneElement(icon, { size: 24 })}
        <span className="text-xs font-medium">{label}</span>
    </button>
);

export default NavButton;
