// backend/src/firestore.ts
import { Firestore } from "@google-cloud/firestore";

const db = new Firestore(); // uses Application Default Credentials on Cloud Run

export async function savePrediction(docId: string, payload: Record<string, unknown>) {
  const col = db.collection("predictions");
  await col.doc(docId).set({
    ...payload,
    createdAt: Firestore.Timestamp.now(),
  });
}

export async function getPrediction(docId: string) {
  const doc = await db.collection("predictions").doc(docId).get();
  return doc.exists ? doc.data() : null;
}
