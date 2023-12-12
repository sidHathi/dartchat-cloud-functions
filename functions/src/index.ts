/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { db } from './firebase';
import { onSchedule } from 'firebase-functions/v2/scheduler';

type Conversation = {
    id: string;
    name: string;
    settings: any;
    messages: any[];
    group: boolean;
    participants: any[];
    avatar?: any;
    polls?: any[];
    events?: any[];
    customLikeIcon?: any;
    publicKey?: string;
    keyInfo?: any;
    adminIds?: string[];
    messageDisappearTime?: number; // hours
};

const cullExpiredMessages = async (colName: string) => {
    try {
        const conversationsCol = db.collection(colName);
        const relevantConvos = await conversationsCol.where('messageDisappearTime', '!=', 0).get();
        const batch = db.batch();
        await Promise.all(
            relevantConvos.docs.map(async (doc) => {
                const convo = doc.data() as Conversation;
                const disappearTime = convo.messageDisappearTime;
                if (!disappearTime) return;

                const threshold = new Date(new Date().getTime() - disappearTime * 1000 * 60 * 60);
                try {
                    const messagesToDelete = await conversationsCol
                        .doc(convo.id)
                        .collection('messages')
                        .where('timestamp', '<', threshold)
                        .get();
                    messagesToDelete.forEach((messageDoc) => {
                        const ref = messageDoc.ref;
                        batch.delete(ref);
                    });
                } catch (err) {
                    console.log(err);
                    return;
                }
            })
        );
        batch.commit();
        return;
    } catch (err) {
        return Promise.reject(err);
    }
};

export const scheduleDelete = onSchedule('0 * * * *', () => cullExpiredMessages('conversations'));
export const scheduleDeleteDev = onSchedule('0 * * * *', () => cullExpiredMessages('conversations-dev'));
