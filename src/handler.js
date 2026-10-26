const processedEvents = new Set(); // w produkcji: baza, nie pamięć

export async function handlePlanChange(client, payload, replayId) {
  const eventId = payload.EventUuid;

  if (processedEvents.has(eventId)) {
    console.log(`Pomijam duplikat ${eventId}`);
    return { skipped: true };
  }

  console.log(`Przetwarzam wniosek ${payload.Request_Id__c}, plan ${payload.New_Plan__c}`);

  const billingResult = await callBillingSystem(payload);

  await client.publish('/event/Plan_Change_Processed__e', {
    Request_Id__c: payload.Request_Id__c,
    Success__c: billingResult.success,
    External_Billing_Id__c: billingResult.id ?? null,
    Error_Message__c: billingResult.error ?? null,
    Processed_At__c: Date.now()
  });

  processedEvents.add(eventId);
  return billingResult;
}

async function callBillingSystem(payload) {
  // atrapa systemu billingowego
  if (payload.New_License_Count__c > 1000) {
    return { success: false, error: 'Przekroczony limit licencji' };
  }
  return { success: true, id: `BILL-${payload.Request_Id__c}` };
}