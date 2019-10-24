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
 * Update flag of a customer in case any medical or fraud issue found
 * @param {ctspod8.aml.insnetwork.updateCust} uCustTrans - transaction instance
 * @transaction
 */
async function updateCust(uCustTrans) {
    let oldflagcode = uCustTrans.cust.custFlagCode;
    let newCode = uCustTrans.newflagCode;

    uCustTrans.cust.custFlagCode = newCode; 
    uCustTrans.cust.custFlagCodeReason = uCustTrans.newflagCodeReason;
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.Customer');
    await assetRegistry.update(uCustTrans.cust);

    console.log(`Before if, newCode : ${newCode}`);
    if (newCode == "MEDICAL" || newCode == "ML" || newCode == "CRIMINAL"){
        // Get all policies for a particular customer and change the post policy flag
        console.log(`Inside if, newCode : ${newCode}`);
    }
    
    // Emitting event for Customer Flag change, which insurance companies can register to
    let basicEvent = getFactory().newEvent('ctspod8.aml.insnetwork', 'CustStatusChngEvent');
    basicEvent.cust = uCustTrans.cust;
    basicEvent.oldVal = oldflagcode;
    basicEvent.newVal = uCustTrans.newflagCode;
    emit(basicEvent);
}

/**
 * Update policy application
 * @param {ctspod8.aml.insnetwork.vaildatePolicy} uPolApp - transaction instance
 * @transaction
 */
async function updatePolicyApplication(uPolApp) {
    let customer = uPolApp.policyAppl.customer;
    let polStatus = "VALIDATION_APPROVED";
    let polStatusReason = "VALIDATION_APPROVED";
    
    // If customer status is not favorable, reject policy
    if (customer.custFlagCode == "MEDICAL" || customer.custFlagCode == "ML" || customer.custFlagCode == "CRIMINAL"){
        polStatus = "VALIDATION_REJECTED";
        polStatusReason = customer.custFlagCodeReason;
    }

    // Check if similar policies have already been rejected by other insurers

    uPolApp.policyAppl.policyStatus = polStatus; 
    uPolApp.policyAppl.policyStatusReason = polStatusReason;
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.Policy');
    await assetRegistry.update(uPolApp.policyAppl);
}


/**
 * Validate claim
 * @param {ctspod8.aml.insnetwork.vaildateClaim} uClaim - transaction instance
 * @transaction
 */
async function validateClaim(uClaim) {
    let originalClaim = uClaim.claim;
    let policy = uClaim.claim.policy;
    let claimant = uClaim.claim.policy.customer;
    let clmstatus = "VALIDATION_APPROVED";
    let clmStatusReason = "Approved";

    //console.log("Before if");
    // Reject validation if the policy is not in force
    /*
    if (policy.policyStatus !== "IN_FORCE"){
        clmstatus = "VALIDATION_REJECTED";
        clmStatusReason = policy.policyStatusReason;
        console.log("Claim rejected, Policy not in force");
    }
    */
    // For mediclaim, check if there are other claims with same event dates for same customer
    
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.Claim');
    const claims = await assetRegistry.getAll();
    for (claim of claims) {
        let claimantother = claim.policy.customer; // Get customer by aadhar
        if (claimantother == claimant){
            clmstatus = "VALIDATION_REJECTED";
            clmStatusReason = "Duplicate Claim. Already exists Claim#: " ||claim.claimId ;
            console.log("Duplicate Claim.");
            break;
        }
    }
    originalClaim.clmStatus = clmstatus;
    originalClaim.clmStatusReason = clmStatusReason;
    await assetRegistry.update(originalClaim);
    
   /*
    // Get the claim asset registry
    return getAssetRegistry('ctspod8.aml.insnetwork.Claim')
    .then(function (claimAssetRegistry) {
    // Get all of the claims in the vehicle asset registry.
    return assetRegistry.getAll();
    })
    .then(function (claims) {
    // Process the array of claim objects.
    claims.forEach(function (claim) {
        console.log(claim.policy.customer);
        let claimantother = claim.policy.customer;
        if (claimantother == claimant){
            clmstatus = "VALIDATION_REJECTED";
            clmStatusReason = "Duplicate Claim. Already exists Claim#: " ||claim.claimId;
            originalClaim.clmstatus = clmstatus;
            originalClaim.clmStatusReason = clmStatusReason;
            await claimAssetRegistry.update(originalClaim);
            console.log("Duplicate Claim.");
        }
    });
    })
    .catch(function (error) {
    // Add optional error handling here.
    });
*/
}