import React from 'react';

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = "button" }) => {
    const baseStyle = "px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-sm active:scale-95";
    const variants = {
        primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed",
        secondary: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:bg-gray-50",
        danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100",
        success: "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-300",
        ghost: "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;
