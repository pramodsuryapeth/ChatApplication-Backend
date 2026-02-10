const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const ivLength = 16;

// 🔑 Secret key (32 bytes)
const secretKey = crypto
  .createHash("sha256")
  .update(process.env.CHAT_SECRET || "default_secret_key")
  .digest()
  .slice(0, 32);

// 🔐 Encrypt message
const encrypt = (text) => {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
};

// 🔓 Decrypt message
const decrypt = (encryptedText) => {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");

  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

module.exports = { encrypt, decrypt };
