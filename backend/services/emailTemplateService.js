const fs = require('fs/promises');
const path = require('path');
const handlebars = require('handlebars');
const env = require('../config/env');

const TEMPLATE_DIR = path.join(__dirname, '../templates');

/**
 * Loads and compiles a Handlebars template.
 * @param {string} templateName - The name of the template file (without extension).
 * @param {object} context - Variables to inject into the template.
 * @returns {Promise<string>} The compiled HTML string.
 */
const compileTemplate = async (templateName, context) => {
    try {
        const filePath = path.join(TEMPLATE_DIR, `${templateName}.hbs`);
        const templateSource = await fs.readFile(filePath, 'utf-8');
        const template = handlebars.compile(templateSource);
        
        // Add common variables
        const commonContext = {
            appName: 'FinTrack',
            year: new Date().getFullYear(),
            ...context
        };

        return template(commonContext);
    } catch (error) {
        console.error(`Error compiling template ${templateName}:`, error);
        throw new Error('Failed to generate email content.');
    }
};

module.exports = {
    compileTemplate
};
