const crypto = require('crypto');

const MAGIC = Buffer.from('LIFEDOC_ENC_V1:');
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getKey = () => {
  const configured = process.env.FILE_ENCRYPTION_KEY || process.env.JWT_SECRET || 'lifedoc-development-file-key';

  if (/^[a-f0-9]{64}$/i.test(configured)) {
    return Buffer.from(configured, 'hex');
  }

  return crypto.createHash('sha256').update(configured).digest();
};

const isEncrypted = (buffer) => buffer.length > MAGIC.length && buffer.subarray(0, MAGIC.length).equals(MAGIC);

const encryptBuffer = (plainBuffer) => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([MAGIC, iv, tag, encrypted]);
};

const decryptBuffer = (storedBuffer) => {
  if (!isEncrypted(storedBuffer)) {
    return storedBuffer;
  }

  const offset = MAGIC.length;
  const iv = storedBuffer.subarray(offset, offset + IV_LENGTH);
  const tag = storedBuffer.subarray(offset + IV_LENGTH, offset + IV_LENGTH + TAG_LENGTH);
  const encrypted = storedBuffer.subarray(offset + IV_LENGTH + TAG_LENGTH);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

module.exports = {
  encryptBuffer,
  decryptBuffer,
  isEncrypted
};
