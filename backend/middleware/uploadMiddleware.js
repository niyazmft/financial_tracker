const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
// Ensure backend/uploads directory exists and use an explicit absolute path so
// multer doesn't depend on the process working directory.
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ 
    dest: uploadsDir,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

module.exports = upload;
