const urls = [
    'https://lh3.googleusercontent.com/a/abc',
    'https://attacker-lh3.googleusercontent.com/a/abc',
    'https://googleusercontent.com/a/abc',
    'https://attackergoogleusercontent.com/a/abc',
    'http://127.0.0.1/abc'
];

const allowedDomains = ['lh3.googleusercontent.com', 'googleusercontent.com'];

urls.forEach(url => {
    const urlObj = new URL(url);

    // old check
    const oldCheck = allowedDomains.some(domain => urlObj.hostname.endsWith(domain));

    // new check
    const newCheck = allowedDomains.some(domain => urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`));

    console.log(`${urlObj.hostname}: old=${oldCheck}, new=${newCheck}`);
});
