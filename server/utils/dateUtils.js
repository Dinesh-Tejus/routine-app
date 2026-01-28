/**
 * Gets the current date formatted as YYYY-MM-DD,
 * accounting for the 12:30 AM day reset.
 */
const getAdjustedDate = (date = new Date()) => {
    const now = new Date(date);

    // If it's before 12:30 AM, treat it as the previous day
    if (now.getHours() === 0 && now.getMinutes() < 30) {
        now.setDate(now.getDate() - 1);
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Gets yesterday's date formatted as YYYY-MM-DD,
 * accounting for the 12:30 AM day reset.
 */
const getAdjustedYesterday = (date = new Date()) => {
    const now = new Date(date);

    // If it's before 12:30 AM, "today" is already shifted 
    // so yesterday is 2 days ago from literal now
    if (now.getHours() === 0 && now.getMinutes() < 30) {
        now.setDate(now.getDate() - 2);
    } else {
        now.setDate(now.getDate() - 1);
    }

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Gets the start of the week (Monday) based on the adjusted date.
 */
const getStartOfWeek = (date = new Date()) => {
    const adjusted = new Date(date);
    // Adjust for 12:30 AM reset
    if (adjusted.getHours() === 0 && adjusted.getMinutes() < 30) {
        adjusted.setDate(adjusted.getDate() - 1);
    }

    const day = adjusted.getDay(); // 0 is Sunday, 1 is Monday...
    const diff = (day === 0 ? -6 : 1) - day; // diff to Monday
    adjusted.setDate(adjusted.getDate() + diff);

    const year = adjusted.getFullYear();
    const month = String(adjusted.getMonth() + 1).padStart(2, '0');
    const d = String(adjusted.getDate()).padStart(2, '0');

    return `${year}-${month}-${d}`;
};

module.exports = {
    getAdjustedDate,
    getAdjustedYesterday,
    getStartOfWeek
};
