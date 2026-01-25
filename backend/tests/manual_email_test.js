const emailService = require('../services/emailService');
const env = require('../config/env');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function testEmail() {
    console.log('\n📧 --- FinTrack Manual Email Diagnostic ---');
    
    const recipient = await askQuestion('📬 Enter recipient email address for test: ');

    if (!recipient || !recipient.includes('@')) {
        console.error('❌ Error: A valid email address is required.');
        process.exit(1);
    }

    console.log(`🚀 Sending test email to ${recipient}...`);
    
    try {
        await emailService.sendEmail(
            recipient, 
            'FinTrack SMTP Test', 
            'welcome-email', 
            {
                appName: 'FinTrack Diagnostic',
                dashboardLink: `${env.FRONTEND_URL}/dashboard`,
                year: new Date().getFullYear()
            }
        );        console.log(`\n✅ Success! Test email has been sent to ${recipient}`);
        console.log('Please check your inbox (and spam folder).');
    } catch (error) {
        console.error('\n❌ Failed to send email.');
        console.error('Error Details:', error.message);
        console.log('\n💡 Tip: Check your SMTP credentials in the .env file.');
    } finally {
        rl.close();
    }
}

testEmail();