const admin = require("firebase-admin");
const service = require("./firebase-service-account.json")



admin.initializeApp({
  credential: admin.credential.cert(service),
});

module.exports = admin;
