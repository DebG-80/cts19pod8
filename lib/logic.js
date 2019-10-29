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
 * Validate claim - validate if the hospitalization date is overlapping with any other approved claim for same claimant
 * @param {ctspod8.aml.insnetwork.vaildateClaim} uClaim - transaction instance
 * @transaction
 */
async function validateClaim(uClaim) {
    let originalClaim = uClaim.claim;
    let originalClaimId = uClaim.claim.claimId;
    let originalClaimantAadhar = uClaim.claim.claimantAadhar;
    let clmStatus = "VALIDATION_APPROVED";
    let clmStatusReason = "Approved";
    var orginalFrmHospDt = new Date(uClaim.claim.fromHospDt);
    var orginalToHospDt = new Date(uClaim.claim.toHospDt);
    let claimantAadharother;
    let claimId;
    var claimFrmHspDt;
    var claimToHspDt;
    let claim;

    // For mediclaim, check if there are other claims with same event dates for same customer
    
    let assetRegistry = await getAssetRegistry('ctspod8.aml.insnetwork.Claim');
    let claims = await assetRegistry.getAll();
    for (claim of claims) {
        claimId = claim.claimId;
        claimantAadharother = claim.claimantAadhar; // Get customer by aadhar
        claimFrmHspDt = new Date(claim.fromHospDt);
        claimToHspDt = new Date(claim.toHospD);
        if (claimantAadharother == originalClaimantAadhar && originalClaimId != claimId && claim.clmStatus == "VALIDATION_APPROVED" 
            && ((orginalFrmHospDt <= claimFrmHspDt && claimFrmHspDt <= orginalToHospDt) || 
            (orginalFrmHospDt <= claimToHspDt && claimToHspDt <= orginalToHospDt) || 
            (claimFrmHspDt < orginalFrmHospDt && orginalToHospDt < claimToHspDt))){
            clmStatus = "VALIDATION_REJECTED";
            clmStatusReason = "Duplicate Claim. Already exists Claim#: " + claimId  + ", with hospitalization dates between "
            + claimFrmHspDt + " and " +  claimToHspDt;
            break;
        }
    }
    //if (a_start <= b_start && b_start <= a_end) return true; // b starts in a
    //if (a_start <= b_end   && b_end   <= a_end) return true; // b ends in a
    //if (b_start <  a_start && a_end   <  b_end)

    originalClaim.lastUpdAgentId = claimId; // check 
    originalClaim.clmStatusReason = clmStatusReason;
    originalClaim.clmStatus = clmStatus; 
 
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