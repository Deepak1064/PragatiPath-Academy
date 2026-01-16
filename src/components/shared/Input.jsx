import React from 'react';

const Input = ({ label, type = 'text', name, value, onChange, placeholder, required = false, disabled = false, className = '' }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${className}`}
        />
    </div>
);

export default Input;

