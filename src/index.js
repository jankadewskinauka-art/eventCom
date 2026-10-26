import 'dotenv/config';
import express from 'express';
import PubSubApiClient from 'salesforce-pubsub-api-client';
import { handlePlanChange } from './handler.js';
import { loadReplayId, saveReplayId } from './replayStore.js';

const TOPIC = '/event/Plan_Change_Requested__e';
const app = express();
let lastReplayId = null;

app.get('/health', (req, res) =>
  res.json({ status: 'ok', lastReplayId })
);

async function start() {
  const client = new PubSubApiClient();
  await client.connect();

  const storedReplayId = await loadReplayId();

  const onEvent = async (subscription, callbackType, data) => {
    if (callbackType === 'event') {
      lastReplayId = data.replayId;
      try {
        await handlePlanChange(client, data.payload, data.replayId);
        await saveReplayId(data.replayId);
      } catch (err) {
        console.error(`Błąd przy replayId=${data.replayId}`, err);
      }
    } else if (callbackType === 'lastEvent') {
      console.log('Koniec paczki, ostatni replayId:', data.replayId);
    } else if (callbackType === 'error') {
      console.error('Błąd subskrypcji:', data);
    }
  };

  if (storedReplayId) {
    console.log(`Wznawiam od replayId=${storedReplayId}`);
     client.subscribeFromReplayId(TOPIC, onEvent, null, storedReplayId);
  } else {
    console.log('Brak zapisanego replayId — start od najnowszych');
     client.subscribe(TOPIC, onEvent);
  }
}

app.listen(process.env.PORT || 3000, () => {
  console.log('HTTP nasłuchuje');
  start().catch(console.error);
});