const fs = require('fs');
let code = fs.readFileSync('backend/tests/emailService.test.js', 'utf8');

// Fix deep copy
code = code.replace(
    /originalEnv = \{ \.\.\.env \};/g,
    `originalEnv = { ...env, SMTP: { ...env.SMTP } };`
);

// Fix restore
code = code.replace(
    /Object.assign\(env, originalEnv\);/g,
    `Object.assign(env, originalEnv);
        env.SMTP = originalEnv.SMTP;`
);

// Fix try/catches
code = code.replace(
    /try \{\s+await emailService\.sendEmail\('to@test\.com', 'Sub', 'tmpl', \{\}\);\s+assert\.fail\('Expected error was not thrown'\);\s+\} catch \(error\) \{\s+assert\.strictEqual\(error\.message, 'SMTP_FROM or SMTP_USER must be defined in environment variables\.'\);\s+\}/g,
    `await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'SMTP_FROM or SMTP_USER must be defined in environment variables.' }
            );`
);

code = code.replace(
    /try \{\s+await emailService\.sendEmail\('to@test\.com', 'Sub', 'tmpl', \{\}\);\s+assert\.fail\('Expected error was not thrown'\);\s+\} catch \(error\) \{\s+assert\.strictEqual\(error\.message, 'Template Compilation Failed'\);\s+assert\(logger\.error\.calledOnce\);\s+\}/g,
    `await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'Template Compilation Failed' }
            );
            assert(logger.error.calledOnce);`
);

code = code.replace(
    /try \{\s+await emailService\.sendEmail\('to@test\.com', 'Sub', 'tmpl', \{\}\);\s+assert\.fail\('Expected error was not thrown'\);\s+\} catch \(error\) \{\s+assert\.strictEqual\(error\.message, 'SMTP Error'\);\s+assert\(logger\.error\.calledOnce\);\s+\}/g,
    `await assert.rejects(
                async () => await emailService.sendEmail('to@test.com', 'Sub', 'tmpl', {}),
                { message: 'SMTP Error' }
            );
            assert(logger.error.calledOnce);`
);

fs.writeFileSync('backend/tests/emailService.test.js', code);
