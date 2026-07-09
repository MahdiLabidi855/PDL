const admin = require("firebase-admin");

let firebaseApp;

if (!admin.apps.length) {
    const databaseURL = process.env.FIREBASE_DATABASE_URL;

    if (!databaseURL) {
        console.warn("Firebase database URL is not configured yet.");
    }

    firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL
    });
} else {
    firebaseApp = admin.apps[0];
}

const db = admin.database();

module.exports = {
    admin,
    db,
    firebaseApp
};
