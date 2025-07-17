const crypto = require('crypto');
const key = (process.env.ENCRYPTION_KEY || 'cognisafe_super_secret_key_123').trim();
const ivLength = 16;

console.log('ENCRYPTION_KEY value:', JSON.stringify(key));
console.log('ENCRYPTION_KEY length:', key.length);
console.log('Key buffer length:', Buffer.from(key, 'utf8').length);

function encrypt(text) {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(data) {
  const [ivHex, encrypted] = data.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf8'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { encrypt, decrypt };