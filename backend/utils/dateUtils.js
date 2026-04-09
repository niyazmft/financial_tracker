const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Helper function to get date range for a specified number of days
function getLookaheadDates(durationDays = 30) {
    const start = new Date();
    // Use UTC methods for consistency
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()));
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate() + parseInt(durationDays, 10)));

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
    };
}

function formatDateForDisplay(dateInput) {
    const date = (dateInput instanceof Date) ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) { // Check for invalid date
        return 'Invalid Date';
    }
    
    // Use UTC methods for consistency
    const day = date.getUTCDate();
    const monthIndex = date.getUTCMonth();
    const year = date.getUTCFullYear();
    return `${monthNames[monthIndex]} ${day}, ${year}`;
}

module.exports = {
    getLookaheadDates,
    formatDateForDisplay,
};