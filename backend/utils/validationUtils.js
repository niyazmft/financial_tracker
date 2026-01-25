// Helper function to normalize Turkish characters to ASCII
function normalizeTurkishChars(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text
        .replace(/ı/g, 'i')     // Turkish dotless i (ı) to regular i
        .replace(/İ/g, 'I')     // Turkish capital I with dot (İ) to regular I
        .replace(/ğ/g, 'g')     // Turkish soft g (ğ) to regular g
        .replace(/Ğ/g, 'G')     // Turkish capital soft G (Ğ) to regular G
        .replace(/ü/g, 'u')     // Turkish u with diaeresis (ü) to regular u
        .replace(/Ü/g, 'U')     // Turkish capital U with diaeresis (Ü) to regular U
        .replace(/ş/g, 's')     // Turkish s with cedilla (ş) to regular s
        .replace(/Ş/g, 'S')     // Turkish capital S with cedilla (Ş) to regular S
        .replace(/ö/g, 'o')     // Turkish o with diaeresis (ö) to regular o
        .replace(/Ö/g, 'O')     // Turkish capital O with diaeresis (Ö) to regular O
        .replace(/ç/g, 'c')     // Turkish c with cedilla (ç) to regular c
        .replace(/Ç/g, 'C');    // Turkish capital C with cedilla (Ç) to regular C
}

// Helper function to normalize and validate bank names
function normalizeAndValidateBank(bankName) {
    if (!bankName || typeof bankName !== 'string') {
        throw new Error('Bank name is required');
    }
    // Per new requirements, only trim the input for free text.
    return bankName.trim();
}

// Helper function to validate and format dates
function validateAndFormatDate(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        throw new Error('Date is required');
    }
    
    let trimmed = dateString.trim();
    
    // Fix common date formatting issues
    // Replace unicode minus signs with regular hyphens
    trimmed = trimmed.replace(/[−—–]/g, '-');
    
    // Handle different date formats
    let formattedDate;
    
    // YYYY-MM-DD (already correct)
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        formattedDate = trimmed;
    }
    // YYYY-MM-D or YYYY-M-DD or YYYY-M-D (missing leading zeros)
    else if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
        const parts = trimmed.split('-');
        const year = parts[0];
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
    }
    // DD/MM/YYYY or DD-MM-YYYY
    else if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
        const parts = trimmed.split(/[/-]/);
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        formattedDate = `${year}-${month}-${day}`;
    }
    else {
        throw new Error(`Invalid date format: '${dateString}'. Use YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY`);
    }
    
    // Validate the date is actually valid
    const date = new Date(formattedDate);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid date: '${dateString}'`);
    }
    
    // Check if date is reasonable (not too far in past/future)
    const now = new Date();
    const minDate = new Date(now.getFullYear() - 10, 0, 1); // 10 years ago
    const maxDate = new Date(now.getFullYear() + 1, 11, 31); // 1 year in future
    
    if (date < minDate || date > maxDate) {
        throw new Error(`Date '${dateString}' is outside acceptable range (${minDate.getFullYear()}-${maxDate.getFullYear()})`);
    }
    
    return formattedDate;
}

// Helper function to validate and format amounts
function validateAndFormatAmount(amountString) {
    if (!amountString && amountString !== 0) {
        throw new Error('Amount is required');
    }
    
    // Handle different amount formats
    let cleanAmount = amountString.toString().trim();
    
    // Remove common currency symbols and commas
    cleanAmount = cleanAmount
        .replace(/[₺$€£,]/g, '') // Remove currency symbols and commas
        .replace(/\s+/g, ''); // Remove spaces
    
    const amount = parseFloat(cleanAmount);
    
    if (isNaN(amount)) {
        throw new Error(`Invalid amount: '${amountString}'. Must be a valid number`);
    }
    
    // Check for reasonable amount limits
    if (Math.abs(amount) > 1000000) { // 1 million limit
        throw new Error(`Amount '${amountString}' exceeds maximum limit of 1,000,000`);
    }
    
    // Round to 2 decimal places
    return Math.round(amount * 100) / 100;
}

// Helper function to normalize and validate categories (Legacy name-based lookup)
function normalizeAndValidateCategory(categoryName, availableCategories) {
    if (!categoryName || typeof categoryName !== 'string') {
        throw new Error('Category name is required');
    }
    
    const normalizedName = normalizeTurkishChars(categoryName.toLowerCase().trim());
    
    // Find category ID by name (case-insensitive and normalized)
    for (const id in availableCategories) {
        if (availableCategories.hasOwnProperty(id) && normalizeTurkishChars(availableCategories[id].toLowerCase()) === normalizedName) {
            return { id: parseInt(id, 10), name: availableCategories[id] };
        }
    }
    
    // No match found
    const availableNames = Object.values(availableCategories).join(', ');
    throw new Error(`Category '${categoryName}' not found. Available: ${availableNames}`);
}

// Helper function to validate category by ID
function validateCategoryById(categoryId, availableCategories) {
    if (!categoryId) {
        throw new Error('Category ID is required');
    }
    
    const idStr = categoryId.toString();
    if (availableCategories[idStr]) {
        return { id: parseInt(categoryId, 10), name: availableCategories[idStr] };
    }
    
    throw new Error(`Invalid or unauthorized Category ID: ${categoryId}`);
}

module.exports = {
    normalizeTurkishChars,
    normalizeAndValidateBank,
    validateAndFormatDate,
    validateAndFormatAmount,
    normalizeAndValidateCategory,
    validateCategoryById,
};
