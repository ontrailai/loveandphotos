/**
 * Love & Photos Contract Text Template
 * Version: LNP-Contract-v2.0
 *
 * This file contains the complete contract text that will be displayed to users
 * before signature. Any changes to this text MUST increment the contract version.
 */

export const CONTRACT_TEMPLATE = `Love & Photos LLC
Love & Photos Wedding Photography & Videography Agreement
Wedding Date: {{eventDate}}
Package: {{packageName}}
Total Price: {{price}}
Booking Date: {{bookingDate}}

This Agreement is made between Love & Photos LLC ("Studio") and the Client who electronically accepts this Agreement ("Client") for wedding photography and/or videography services. By signing electronically, the Client agrees to the terms outlined in this Agreement as well as our full Terms & Conditions, which can be found at https://loveandphotos.com/terms-conditions.

---

1. Services & Deliverables
1.1 Services Provided
Based on our mutual agreement, the Studio will provide the package selected by the Client for their wedding event.
1.2 Deliverables
Photography: If photography services are provided, the Client will receive hundreds of professionally edited photos delivered digitally.
Videography: If videography services are provided, the Client will receive one professionally edited 5-10 minute film delivered digitally.
Both Services: If both photography and videography are provided, the Client will receive the respective deliverables for each service as detailed above (or as otherwise agreed upon).

---

2. Payment & Fees
2.1 Package Cost
The cost for the services is included above under Total Price.
2.2 Add Ons
$395 Insured Photographer — Protects you from liability in case of accidents or damage. Highly recommended.
$50 One-Time Date Change — Covers one emergency reschedule if purchased at the time of initial package purchase. Becomes $495 if purchased after the initial purchase.
Second Photographer — Starts at $400 for 4 hours. Second shooters always match your booked hours & package price for seamless coverage. 4 hour minimum. For photo + video packages, the second shooter fee is 50% of the total package price.
$395 Raw Footage — We'll deliver all the raw media. Unfiltered. Unedited.
Mileage Fee — If the location is outside our usual coverage area, a travel fee will apply depending on distance. The Client will be made aware of this fee before payment is processed.

2.3 Future Add-Ons or Additional Hours
If the Client purchases any add-ons or additional hours at a later date, those items are not covered under this contract and will require separate payment.

2.4 Payment Terms
Reservation: A full or partial payment is required upfront to secure our services.
Final Payment: The remaining balance must be paid at least two (2) months prior to the wedding date.
Monthly Payment Plan: The Client may choose the $199 monthly payment plan, subject to a one-time processing fee of $150. Monthly payments will be billed accordingly, with any outstanding balance due two months before the wedding.
Upfront Deposit Option: If opting for an upfront deposit, the remaining balance is due two months before the wedding.
Third-Party Payment Option: If a third party is covering the cost, the Client listed in this contract remains fully responsible for all terms, conditions, and obligations outlined herein.

2.5 Non-Refundable Fees
All fees are non-refundable under any circumstances. Any breach of this Agreement by the Client will forfeit any right to a refund or our services.

2.6 Cancellation Policy for Month-to-Month Payment Clients
For clients who elect to pay on a month-to-month basis rather than the full Package Price upfront, all payments remain non-refundable. If the Client cancels the services under the month-to-month payment arrangement, a cancellation fee of $150 will be billed. In addition, clients choosing the month-to-month payment plan will incur a $150 processing fee (this fee can be avoided by paying in full upfront). To initiate cancellation, the Client must provide written confirmation via email to: studio@loveandphotos.com

---

3. Cancellation, Unavailability, & Indemnification
3.1 Cancellation by Studio
In the event that Love & Photos LLC is forced to cancel, breach this Agreement, or becomes unavailable for the event due to a last-minute emergency or unforeseen circumstance, the Client will receive a 100% refund of all payments made. By signing this Agreement, the Client agrees that neither they nor any party acting on their behalf—including family members, agents, or representatives—shall initiate any legal action or claims against Love & Photos LLC related to such cancellation or unavailability.

3.2 Indemnification
The Client agrees to indemnify, defend, and hold harmless Love & Photos LLC, including its owners, employees, contractors, videographers, photographers, and affiliates, from and against any and all claims, liabilities, damages, losses, or expenses (including reasonable attorney's fees) arising out of or relating to the photography and/or videography services provided. This includes, but is not limited to, personal injury, property damage (including damage to the venue or any premises), third-party claims, or any act or omission by the Client, their guests, vendors, or event participants. This indemnification applies regardless of whether such claims arise before, during, or after the event, and shall remain in effect even after the completion of services or termination of this agreement.

---

4. Creative & Staffing Rights
4.1 Staffing
Love & Photos LLC reserves the right to select and assign the photography and/or videography team for the event. If the specific photographer or videographer the Client has selected becomes unavailable, Love & Photos LLC may replace them at any time, for any reason.
**IMPORTANT:** The Client acknowledges that replacement of talent does not entitle them to compensation, refund, or credit of any kind.

4.2 Creative Control
All final editing and creative decisions—including but not limited to color correction, image selection, composition, filming style, and overall creative approach—remain at the sole discretion of Love & Photos LLC. The Client acknowledges that they are contracting Love & Photos LLC for its style and expertise, and agrees to accept the final product as delivered.
For further details on delivery timelines, usage rights, and other conditions, please refer to our full Terms & Conditions.

---

5. Studio Breaks and Vendor Meal
If the Studio's assigned team member(s) (photographer and/or videographer) are scheduled to be on-site for more than four (4) hours, they are entitled to a 30-minute break. During this break, a vendor meal must be provided. The cost and coordination of the vendor meal are the responsibility of the Client.

---

6. Client Acknowledgment
By electronically signing, the Client confirms that they have read, understood, and agreed to all terms stated in this Agreement and our full Terms & Conditions.

We look forward to capturing your special day with creativity and warmth. If you have any questions about this Agreement, please feel free to reach out.

(End of Contract v{{contractVersion}})`

/**
 * Populates the contract template with actual booking data
 * @param {Object} bookingData - The booking information
 * @param {string} bookingData.eventDate - Formatted event date (MM/DD/YYYY)
 * @param {string} bookingData.location - Location string (City, State)
 * @param {string} bookingData.packageName - Package name
 * @param {string} bookingData.price - Formatted price (e.g., "$2,500")
 * @param {string} bookingData.bookingDate - Formatted booking date (MM/DD/YYYY)
 * @param {string} contractVersion - Contract version (e.g., "LNP-Contract-v2.0")
 * @returns {string} The populated contract text
 */
export function populateContractTemplate(bookingData, contractVersion) {
  // Get booking date - use current date if not provided
  const bookingDate = bookingData.bookingDate || new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })

  return CONTRACT_TEMPLATE
    .replace(/\{\{eventDate\}\}/g, bookingData.eventDate)
    .replace(/\{\{location\}\}/g, bookingData.location)
    .replace(/\{\{packageName\}\}/g, bookingData.packageName)
    .replace(/\{\{price\}\}/g, bookingData.price)
    .replace(/\{\{bookingDate\}\}/g, bookingDate)
    .replace(/\{\{contractVersion\}\}/g, contractVersion)
}

/**
 * Gets the raw contract template for hashing purposes
 * @returns {string} The raw template with placeholders
 */
export function getRawContractTemplate() {
  return CONTRACT_TEMPLATE
}