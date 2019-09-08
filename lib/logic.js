/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';
/**
 * Write your transction processor functions here
 */

/**
 * Sample transaction
 * @param {ctspod8.aml.insnetwork.SampleTransaction} sampleTransaction
 * @transaction
 */

/*
async function sampleTransaction(tx) {
    // Save the old value of the asset.
    const oldValue = tx.asset.value;

    // Update the asset with the new value.
    tx.asset.value = tx.newValue;

    // Get the asset registry for the asset.
    const assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.SampleAsset');
    // Update the asset in the asset registry.
    await assetRegistry.update(tx.asset);

    // Emit an event for the modified asset.
    let event = getFactory().newEvent('ctspod8.aml.insnetwork', 'SampleEvent');
    event.asset = tx.asset;
    event.oldValue = oldValue;
    event.newValue = tx.newValue;
    emit(event);
}
*/ // Above code was auto - generated, commented

/**
 * Update flag of a customer in case any medical or fraud issue found
 * @param {ctspod8.aml.insnetwork.updateCust} uCustTrans - transaction instance
 * @transaction
 */
async function updateCust(uCustTrans) {
    let oldflagcode = uCustTrans.cust.custFlagCode;

    uCustTrans.cust.custFlagCode = uCustTrans.newflagCode; 
    uCustTrans.cust.custFlagCodeReason = uCustTrans.newflagCodeReason;
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.Customer');
    await assetRegistry.update(uCustTrans.cust);
    
    //let factory = getFactory();
    let basicEvent = getFactory().newEvent('ctspod8.aml.insnetwork', 'CustStatusChngEvent');
    basicEvent.cust = uCustTrans.cust;
    basicEvent.oldVal = oldflagcode;
    basicEvent.nevVal = uCustTrans.newflagCode;
    emit(basicEvent);
}

/**
 * Update policy application
 * @param {ctspod8.aml.insnetwork.updatePolicy} uPolApp - policy application to be updated
 * @transaction
 */
async function updatePolicyApplication(uPolApp) {
    uPolApp.policyAppl.applicationStatus = uPolApp.newapplicationStatus; 
    uPolApp.policyAppl.applicationStatusReason = uPolApp.newapplicationStatusReason;
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.PolicyApplication');
    await assetRegistry.update(uPolApp.policyAppl);
}