// Date utility functions for consistent date handling

/**
 * Get today's date as a consistent string (YYYY-MM-DD format)
 * This ensures the same format regardless of user's locale
 */
export const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Format a date for display (user-friendly format)
 */
export const formatDisplayDate = (date) => {
    return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });
};
