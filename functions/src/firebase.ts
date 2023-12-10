/* eslint-disable @typescript-eslint/no-var-requires */
import * as admin from 'firebase-admin';

const serviceAcc = require('../service-account-key.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAcc),
    databaseURL: process.env.FIREBASE_DB_URL || ''
});

export const db = admin.firestore();

export default admin;
