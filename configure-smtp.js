const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log('==================================================');
// Logo text
console.log('          PV STUDIOS EMAIL CONFIGURATION          ');
console.log('==================================================\n');
console.log('This script will configure real email sending for OTP verification.');
console.log('Your credentials will be saved in a private local ".env" file.\n');

rl.question('1. Enter your Gmail / SMTP email address: ', (email) => {
    if (!email.trim()) {
        console.log('Email cannot be empty.');
        rl.close();
        return;
    }

    rl.question('2. Enter your Google App Password (16 letters, e.g. "abcd efgh ijkl mnop"): ', (password) => {
        if (!password.trim()) {
            console.log('Password cannot be empty.');
            rl.close();
            return;
        }

        const envContent = `# SMTP Configuration for PV Portal
SMTP_ENABLED=true
SMTP_EMAIL=${email.trim()}
SMTP_PASSWORD=${password.trim()}
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
`;

        try {
            fs.writeFileSync(path.join(__dirname, '.env'), envContent, 'utf8');
            console.log('\n--------------------------------------------------');
            console.log('SUCCESS: SMTP configuration saved to private local ".env" file.');
            console.log('--------------------------------------------------');
            console.log('Next steps:');
            console.log('1. Close this script.');
            console.log('2. Restart the auth server (the server will automatically read the new credentials).');
        } catch (err) {
            console.error('Failed to write .env file:', err);
        }

        rl.close();
    });
});
