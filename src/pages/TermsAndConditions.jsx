import { useEffect } from 'react'

const TermsAndConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-blush-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
          <h1 className="text-4xl font-display font-bold text-dusty-900 mb-4">
            Terms and Conditions for Love and Photos
          </h1>
          <p className="text-dusty-600 mb-8">Last Updated: September 8th, 2025</p>

          <div className="bg-blush-50 border-l-4 border-blush-500 p-6 mb-8">
            <h2 className="text-xl font-semibold text-dusty-900 mb-3">IMPORTANT:</h2>
            <p className="text-dusty-700 leading-relaxed">
              These Terms and Conditions must be accepted by the Client before payment is accepted or services are rendered. By clicking the payment button, providing payment, or otherwise confirming your booking—and submitting payment—the Client acknowledges that they have reviewed our website and have selected a specific photography and/or photography + video package (the "Package"), and that all details provided (including the wedding date and location) are correct and complete. These Terms and Conditions supersede any prior or simultaneous agreements between the parties.
            </p>
          </div>

          <div className="space-y-10 text-dusty-700">
            {/* Section 1: Products and Services */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                1. PRODUCTS AND SERVICES
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">1.1 Package Selection and Confirmation</h3>
                  <p className="leading-relaxed">
                    The Client has selected a Package that fully describes the products and services to be provided on the agreed wedding date at the specified location. By clicking the payment button, providing payment, or otherwise confirming your booking—and submitting payment—the Client acknowledges that they have reviewed our website and selected a specific photography and/or photography + video package (the "Package"), and that all details provided (including the wedding date and location) are correct and complete.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">1.2 Service Execution</h3>
                  <p className="leading-relaxed">
                    In exchange for the full Package Price (as defined below), Love and Photos commits to performing all services as described in the Package on the wedding date. Our services commence upon receipt of payment and include all necessary pre-event planning, coordination, and arrangements.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">1.3 Ghosting Policy</h3>
                  <p className="leading-relaxed">
                    Clients have 30 days from the time of their initial payment to sign the contract and confirm which package they want. If neither is completed within that 30-day window, the booking will be considered canceled. In that case, the client forfeits both the right to our services.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 2: Payment Terms */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                2. PAYMENT TERMS AND NON-REFUNDABLE POLICY
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">2.1 Payment Requirements</h3>
                  <p className="leading-relaxed">
                    The total Package Price, including any applicable taxes and fees, must be paid in full at least two (2) months prior to the wedding date. Failure to pay on time will result in the loss of any payments and guarantee of services. All payments—including any deposits and the full Package Price—are non-refundable and non-transferable. Once submitted, no refunds or credits will be provided under any circumstances, regardless of cancellation or rescheduling.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">2.2 Late Booking Fees</h3>
                  <p className="leading-relaxed">
                    If a client books our services and their wedding is scheduled within 31 days of the booking date, a Late Booking Fee of $450 per team member will be added to the package total. This fee helps cover the additional coordination, scheduling, and prep work required for short-notice events.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">2.3 Immediate Service Commitments</h3>
                  <p className="leading-relaxed">
                    Upon payment, Love and Photos immediately begins its preparatory work (scheduling, securing assignments, coordinating with our team, etc.). The Client acknowledges that our pre-event commitments and financial expenditures are time-sensitive. As a result, even if the Client cancels or reschedules (see Section 4.3), all payments remain final except as specifically noted herein.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">2.4 Cancellation Policy for Month-to-Month Payment Clients</h3>
                  <p className="leading-relaxed">
                    For clients who elect to pay on a month-to-month basis rather than the full Package Price upfront, all payments remain non-refundable. If the Client cancels the services under the month-to-month payment arrangement, a cancellation fee of $150 will be billed. In addition, clients choosing the month-to-month payment plan will incur a $150 processing fee (this fee can be avoided by paying in full upfront). To initiate cancellation, the Client must provide written confirmation via email to: <a href="mailto:studio@loveandphotos.com" className="text-blush-600 hover:text-blush-700 underline">studio@loveandphotos.com</a>
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">2.5 Late Payment Policy</h3>
                  <p className="leading-relaxed">
                    If a payment fails, there's a $15 dollar penalty, and a 10-day grace period to resolve it. However, all remaining balances must be paid in full no later than two (2) months before the wedding date. If a payment failure occurs within that two-month window, the grace period does not apply. In such cases, services will be canceled immediately, and the client forfeits both the right to our services and any refund.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3: Pre-Event Planning */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                3. PRE-EVENT PLANNING AND LOGISTICS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">3.1 Communication and Information Gathering</h3>
                  <p className="leading-relaxed">
                    After accepting these Terms and Conditions, the Client must fill out an electronic questionnaire where they submit essential logistical details (arrival address, schedule, etc.). This information must be provided by the deadline specified—no later than fourteen (14) days prior to the wedding date. Failure to complete and return the electronic questionnaire at least fourteen (14) days prior to the wedding date will null and void any right to our services, and no refund will be issued. The information provided in this electronic questionnaire will serve as the sole source of logistical details for our team and will supersede any alternate communications (e.g., emails or text messages).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">3.2 Proof of Insurance</h3>
                  <p className="leading-relaxed">
                    If the Client has purchased the Insured Photographer Add-On, Love and Photos will provide a Certificate of Insurance (COI) for the assigned contractor. Proof of insurance will be available no earlier than one (1) week prior to the wedding date and will only be provided upon request. Clients who do not purchase this Add-On are not eligible to receive insurance documentation.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4: Event Logistics */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                4. EVENT LOGISTICS, RESCHEDULING, AND COVERAGE HOURS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.1 Arrival Time and Address</h3>
                  <p className="leading-relaxed">
                    The Client must provide an arrival address and arrival time for the event via the electronic questionnaire at least fourteen (14) days before the wedding date. If no arrival time or address is given, Love and Photos will not be present, and the client will not be issued a refund. The start time is considered the start of continuous, paid coverage and should be at least 30 minutes prior to any scheduled event activities (e.g., ceremonies or first looks).
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.2 Coverage Hours</h3>
                  <p className="leading-relaxed mb-3">
                    Coverage hours are continuous and billed in full-hour increments. The scheduled start and end times, as submitted by the Client, define our paid coverage period. If an important activity is still in progress at the end of the scheduled period—and if our on-site crew determines that departing would disrupt the event—Love and Photos may extend coverage by one (1) additional hour. Any additional hours will be added to the Package Price at a rate of $300 per additional hour, per team member.
                  </p>
                  
                  <div className="ml-6 space-y-3">
                    <div>
                      <h4 className="font-semibold text-dusty-800">4.2A Additional Hours Before Event</h4>
                      <p className="leading-relaxed">
                        If additional hours of coverage are requested after the initial package purchase but before the wedding date, they will be billed at $150 per additional hour, per team member.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-dusty-800">4.2B Additional Hours During Event</h4>
                      <p className="leading-relaxed">
                        If additional hours are requested during the event itself, they will be billed at $300 per hour, per team member. All additional hours are billed consecutively.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.3 Rescheduling</h3>
                  <p className="leading-relaxed mb-3">
                    At the time of booking, the Client may purchase a one‑time Date Change Add‑On for an additional fee as set forth on our booking page.
                  </p>
                  <p className="leading-relaxed mb-3">
                    If the Date Change Add‑On is purchased at the time of initial booking, the Client may request one date change by providing written notice at least fifteen (15) days before the original wedding date. If the Date Change Add‑On is not purchased at the time of booking and the Client requests a date change, the Client must pay a $495 fee, and must provide notice at least fifteen (15) days before the original wedding date. All payments under the original booking remain final and non‑transferable.
                  </p>
                  <p className="leading-relaxed">
                    Any additional rescheduling requests beyond that one‑time change (whether the Add‑On was purchased and already used, or not) will be treated as a cancellation under Section 7, with no refund and subject to the fees outlined in Section 7.2.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.4 Contractor Breaks and Vendor Meal</h3>
                  <p className="leading-relaxed">
                    If our contractor (photographer/videographer) is present for more than 4 hours, they are entitled to a 30-minute break during which a vendor meal will be provided. The cost of the meal will be covered by the Client.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.5 Overtime, Travel, and Additional Fees</h3>
                  <p className="leading-relaxed">
                    Any time worked beyond the scheduled coverage included in the Package will be considered overtime and billed according to Section 4.2A. The agreed-upon package includes travel between locations within a 15-mile radius of the venue. Any additional travel beyond this area will incur a fee of $0.70 per mile. Retouching or any editing requests beyond the standard Package inclusions will incur additional charges, which will be quoted separately.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">4.6 Second Photographer Coverage</h3>
                  <p className="leading-relaxed mb-3">
                    If the Client adds a second shooter to their Package, the following applies:
                  </p>
                  <ul className="ml-6 space-y-2">
                    <li className="flex">
                      <span className="text-blush-500 mr-2">•</span>
                      <span>For photo-only Packages: $100 per hour, per second shooter</span>
                    </li>
                    <li className="flex">
                      <span className="text-blush-500 mr-2">•</span>
                      <span>For photo + video Packages: 50% of the total Package Price, per second shooter</span>
                    </li>
                  </ul>
                  <p className="leading-relaxed mt-3 ml-6 text-dusty-600 italic">
                    Example: If a 12-hour photo + video package is $3,100, one second shooter would cost $1,550
                  </p>
                  <p className="leading-relaxed mt-3">
                    Second shooters must be booked for the same duration as the lead photographer or videographer, and their coverage hours must match exactly. For example, if the main shooter is scheduled from 12 pm to 8 pm, the second shooter must also be present for the entire period and cannot operate on a separate or split timeline.
                  </p>
                  <p className="leading-relaxed mt-3">
                    Second shooters cannot be added for events lasting 3 hours or less.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5: Studio Team Selection */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                5. STUDIO TEAM SELECTION
              </h2>
              <p className="leading-relaxed">
                Love and Photos relies on a team of skilled professionals to deliver our services. We retain sole discretion in selecting the lead and, if applicable, the assistant photographer and/or videographer. In the event of illness, scheduling conflicts, or other unforeseen circumstances, we may substitute team members with qualified professionals who meet our standards for technical and artistic quality.
              </p>
            </section>

            {/* Section 6: Safe Working Conditions */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                6. SAFE WORKING CONDITIONS AND EQUIPMENT CARE
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">6.1 Safe Environment</h3>
                  <p className="leading-relaxed">
                    The Client is responsible for ensuring that the event environment is safe, legal, and free from harassment, threats, or dangerous conditions. If our team encounters behavior or conditions that are unsafe, threatening, or abusive, Love and Photos reserves the right to cease services immediately and depart the premises. In such cases, no refund will be issued.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">6.2 Equipment Protection</h3>
                  <p className="leading-relaxed">
                    The Client must exercise reasonable care to safeguard any Love and Photos equipment (cameras, lenses, lighting, etc.) that may come under the control of any Client Party. Should any equipment be damaged or lost due to negligence or other improper acts while under Client control, the Client agrees to promptly reimburse Love and Photos for the replacement cost and any related expenses.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 7: Cancellation */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                7. CANCELLATION, NON-REFUNDABILITY, AND LIQUIDATED DAMAGES
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">7.1 Cancellation and Non-Refundability</h3>
                  <p className="leading-relaxed">
                    Because Love and Photos commits significant resources and schedules our team based on the agreed wedding date, all payments are final and non-refundable. If the Client cancels the event or our services for any reason, all funds paid remain non-refundable and non-transferable to any future date, unless otherwise agreed to in writing by Love and Photos.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">7.2 Rescheduling Fee and Liquidated Damages</h3>
                  <p className="leading-relaxed">
                    Should the Client choose to reschedule (beyond the one-time provision in Section 4.3), the Client agrees to pay a fee of $495 before the next date is arranged and scheduled. This fee is intended to cover our incurred costs, including pre-event preparations and commitments made to third parties. If there are any other unpaid fees, they are to be paid at this time as well.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">7.3 Studio Cancellation and Refund</h3>
                  <p className="leading-relaxed">
                    In the event that Love and Photos cancels the services and is unable to provide a replacement photographer, the Client will receive a full refund of all payments made.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8: Deliverables */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                8. DELIVERABLES AND ACCESS TO EDITED MEDIA
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.1 Delivery of Edited Media and Turnaround Time</h3>
                  <p className="leading-relaxed">
                    Final edited photos will be delivered to the Client up to 3 months from the wedding date. The edited video will be available up to 4 months from the wedding date. Following the event and subsequent editing process, Love and Photos will deliver the final, edited photos (and video, if applicable) via a download link or digital album provided to the Client. These methods are the sole method for accessing the final deliverables. Once the media is delivered, it is considered final. The Company has no obligation to perform any further edits to any photos or video, even if requested by the Client.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.2 Rush Delivery Add-On</h3>
                  <p className="leading-relaxed">
                    Clients who purchase Rush Delivery will be placed in an expedited editing queue. Final edited photos will be delivered to the Client approximately 7 days after the wedding date. The edited video will be available within 30 days. These turnaround times are estimated. While the Company strives to meet the stated Rush timelines, delivery dates are not guaranteed. Any file issues, upload delays, or unforeseen circumstances may impact the timeline. By selecting Rush Delivery, the Client acknowledges that this upgrade accelerates their position in the editing queue but does not entitle them to a specific delivery date.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.3 Access Period and Download Rights</h3>
                  <p className="leading-relaxed">
                    The download link will remain active for two (2) months from the delivery date. During this period, the Client may download the edited media an unlimited number of times for personal use.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.4 Exclusion of Raw Materials</h3>
                  <p className="leading-relaxed">
                    The Client acknowledges that only edited, final versions of images and/or videos will be provided. No raw or unedited files will be supplied under any circumstances. Unless purchased as an Add-On.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.5 Re-editing Fees</h3>
                  <p className="leading-relaxed mb-3">
                    Re-edits requested after final delivery will incur additional charges: $75 per photo or $450 for video edits. These fees apply to any changes beyond the standard edits included in the original package. The Studio reserves the right to decline any additional editing requests at its discretion.
                  </p>
                  
                  <div className="ml-6">
                    <h4 className="font-semibold text-dusty-800 mb-2">8.5A À La Carte Video Editing Options</h4>
                    <p className="leading-relaxed mb-3">
                      The Client may purchase additional edited films as add-ons to their Package. À la carte video editing services are not available as standalone bookings. Pricing is as follows:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex">
                        <span className="text-blush-500 mr-2">•</span>
                        <span>5–10 minute highlight film: Included with all photo + video Packages</span>
                      </li>
                      <li className="flex">
                        <span className="text-blush-500 mr-2">•</span>
                        <span>60-second sneak peek film: $450</span>
                      </li>
                      <li className="flex">
                        <span className="text-blush-500 mr-2">•</span>
                        <span>20–25 minute film: $650</span>
                      </li>
                      <li className="flex">
                        <span className="text-blush-500 mr-2">•</span>
                        <span>30–60 minute film: $1,150</span>
                      </li>
                    </ul>
                    <p className="leading-relaxed mt-3">
                      All à la carte editing requests must be confirmed in writing prior to the commencement of editing. Once purchased, à la carte editing fees are non-refundable. Delivery timelines for à la carte films will follow the same turnaround times set forth in Section 8.1, unless otherwise stated in writing.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.6 Backup & Storage</h3>
                  <p className="leading-relaxed mb-3">
                    Love and Photos will keep a backup of your wedding photos and video for 2 months after we deliver them. After that, we're no longer responsible for storing or providing copies.
                  </p>
                  <p className="leading-relaxed mb-3">
                    If you request copies after the 2-month window, there's a $400 storage fee to unarchive the files. This gives you temporary access for 30 days.
                  </p>
                  <p className="leading-relaxed">
                    Please note: we do not guarantee that backups will be available after the 2-month period.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.7 Data Loss Protection</h3>
                  <p className="leading-relaxed">
                    The Studio agrees to take all reasonable precautions to prevent data loss. In the event of full and unrecoverable data loss, the Client will receive a full refund of all payments made. This does not apply to partial data losses.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">8.8 Drone Coverage With Video Packages</h3>
                  <p className="leading-relaxed">
                    Drone coverage depends on pilot and site availability; while it isn't guaranteed, we'll include aerial shots whenever possible.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 9: Warranty and IP */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                9. WARRANTY, PROFESSIONAL EXCLUSIVITY, AND INTELLECTUAL PROPERTY
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">9.1 Warranty and "As-Is" Services</h3>
                  <p className="leading-relaxed">
                    Love and Photos retains full production and editorial control over all deliverables. Except as provided herein, all services and deliverables are provided "as-is" without any warranty of any kind—express or implied—including any warranty of merchantability or fitness for a particular purpose.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">9.2 Professional Exclusivity</h3>
                  <p className="leading-relaxed">
                    The Client agrees that Love and Photos is the exclusive provider of professional photography and/or videography services on the wedding date. The Client shall not engage any additional professionals to perform similar services during the event.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">9.3 Copyright and Client Photo Rights</h3>
                  <p className="leading-relaxed">
                    Love and Photos retains copyright ownership of the images. The Client will receive full printing, sharing, and distribution rights to the final edited images for personal use, including printing, sharing online, and creating photo albums. The Client is not permitted to modify the deliverables or use them for commercial purposes without our prior written consent.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">9.4 WARRANTY OF MERCHANTABILITY</h3>
                  <p className="leading-relaxed">
                    Client grants Love and Photos full production and editorial control regarding all aspects of the Products. Love and Photos makes no guarantee, either expressed or implied, regarding the aesthetic qualities of the Products and services offered, including any specific effect, request, and/or pose, photographed or videotaped segments. EXCEPT AS SET FORTH IN THIS SECTION, AND TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALL SERVICES AND GOODS, INCLUDING PHOTOGRAPHS AND VIDEO, PROVIDED HEREUNDER ARE PROVIDED "AS-IS", WITHOUT ANY WARRANTY OF ANY KIND AND LOVE AND PHOTOS HEREBY DISCLAIMS ALL OTHER WARRANTIES, EXPRESS, IMPLIED OR STATUTORY, INCLUDING, WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 10: Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                10. DISPUTE RESOLUTION AND ARBITRATION
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">10.1 Mandatory Arbitration</h3>
                  <p className="leading-relaxed">
                    Any dispute, controversy, or claim arising out of or relating to these Terms and Conditions—including its interpretation, performance, or breach—shall be resolved by binding arbitration under the rules of an agreed-upon arbitration provider in San Diego County, California.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">10.2 Costs and Fees</h3>
                  <p className="leading-relaxed">
                    The prevailing party in any arbitration proceeding shall be entitled to recover reasonable attorney's fees and other administrative costs from the other party.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">10.3 Governing Law and Jurisdiction</h3>
                  <p className="leading-relaxed">
                    These Terms and Conditions shall be governed by and construed in accordance with the laws of the State of California. Any disputes not resolved through arbitration shall be subject to the exclusive jurisdiction of the courts located in San Diego County.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 11: Miscellaneous */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                11. MISCELLANEOUS PROVISIONS
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.1 Indemnification</h3>
                  <p className="leading-relaxed">
                    The Client agrees to indemnify and hold harmless Love and Photos, its affiliates, employees, contractors, and agents from any losses, damages, or liabilities arising from any breach of these Terms and Conditions by the Client or from the performance of our services, except in cases of gross negligence or willful misconduct.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.2 Assignability and Third-Party Beneficiaries</h3>
                  <p className="leading-relaxed">
                    These Terms and Conditions shall be binding upon and inure to the benefit of the respective successors and assigns of the parties. No person or entity not a party to these Terms and Conditions shall have any rights or remedies hereunder unless expressly provided.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.3 Severability</h3>
                  <p className="leading-relaxed">
                    If any provision of these Terms and Conditions is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. The invalid or unenforceable provision shall be reformed to reflect the original intent as closely as possible.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.4 Counterparts and Electronic Signatures</h3>
                  <p className="leading-relaxed">
                    These Terms and Conditions may be executed in counterparts and by electronic agreement, all of which together shall constitute one instrument.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.5 Entire Agreement</h3>
                  <p className="leading-relaxed">
                    These Terms and Conditions, including any forms or questionnaires completed online, constitute the entire agreement between the Client and Love and Photos regarding the subject matter herein and supersede all prior agreements—written or oral.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.6 Modifications to Terms and Conditions</h3>
                  <p className="leading-relaxed">
                    Love and Photos reserves the right to modify, update, or change these Terms and Conditions at any time without prior notice. It is the Client's responsibility to review these Terms and Conditions periodically. Continued use of our services after any modifications constitutes acceptance of the revised terms.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">11.7 Website, Social Media, and Sample Displays</h3>
                  <p className="leading-relaxed">
                    The Client acknowledges that Love & Photos showcases both our own work and sample media from third-party sources to illustrate our services, quality, and style.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 12: Marketing */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                12. MARKETING & PROMOTIONAL USE
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">12.1 License Grant</h3>
                  <p className="leading-relaxed mb-3">
                    Client hereby grants Love & Photos LLC a non‑exclusive, worldwide, perpetual, royalty‑free license to reproduce, display, distribute, and otherwise use any and all photos, video, and related deliverables created under this Agreement ("Deliverables") for Love & Photos' marketing and promotional purposes. Such purposes include, but are not limited to:
                  </p>
                  <ul className="ml-6 space-y-2">
                    <li className="flex">
                      <span className="text-blush-500 mr-2">•</span>
                      <span>Publishing Deliverables on Love & Photos' website and online galleries</span>
                    </li>
                    <li className="flex">
                      <span className="text-blush-500 mr-2">•</span>
                      <span>Sharing Deliverables on social media platforms (e.g., Instagram, Facebook, TikTok, Pinterest)</span>
                    </li>
                    <li className="flex">
                      <span className="text-blush-500 mr-2">•</span>
                      <span>Incorporating Deliverables in print and digital advertising, brochures, proposals, and portfolio presentations</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">12.2 Editing & Cropping</h3>
                  <p className="leading-relaxed">
                    Love & Photos may resize, crop, color‑grade, add watermarks or other graphics, and otherwise modify Deliverables as reasonably necessary for each marketing channel.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">12.3 Use of Names & Likeness</h3>
                  <p className="leading-relaxed">
                    Client also grants Love & Photos permission to use Client's first names, initials, and likeness in connection with any promotional usage of the Deliverables.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">12.4 Opt‑Out</h3>
                  <p className="leading-relaxed">
                    If Client prefers that any specific images, video clips, or identifying information not be used for marketing, Client must notify Love & Photos in writing within 14 days of delivery. Upon receipt of such notice, Love & Photos will cease any future promotional use of the specified content.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">12.5 No Additional Fee</h3>
                  <p className="leading-relaxed">
                    This marketing license is granted at no additional cost; it does not affect Client's personal usage rights (printing, sharing, or archiving) as set forth elsewhere in this Agreement.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 13: Disclaimer */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                13. DISCLAIMER OF LIABILITY
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-dusty-800 mb-2">13.1 Disclaimer of Liability</h3>
                  <p className="leading-relaxed mb-3">
                    Love and Photos shall not be liable to you for any injury, loss, expense, or damages incurred or sustained by you or any member of your family or guests arising from, relating to, or connected with the use of the Love and Photos website or services, including without limitation, the acts or omissions of any assigned Love and Photos photographer, videographer, contractor, or staff member.
                  </p>
                  <p className="leading-relaxed mb-3">
                    Love and Photos, its contractors, and its employees are not responsible for any loss or damage to image or video files created, stored, or delivered, even if caused by negligence or other fault. Without limiting the foregoing, in no case shall Love and Photos, its directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers, or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including but not limited to lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages, whether based in contract, tort (including negligence), strict liability, or otherwise, arising from your use of any of our services or any products procured using the services, or for any other claim related in any way to your use of the services or any product, including but not limited to any errors or omissions in content or any loss or damage of any kind incurred as a result of the use of our services or any content posted, transmitted, or otherwise made available via the services.
                  </p>
                  <p className="leading-relaxed">
                    If applicable law does not permit the exclusion or limitation of liability for consequential or incidental damages, in such jurisdictions Love and Photos' liability shall be limited to the maximum extent permitted by law.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-6">
                CONTACT INFORMATION
              </h2>
              <p className="leading-relaxed mb-2">
                For questions, concerns, or notices regarding these Terms and Conditions, please contact:
              </p>
              <p className="font-medium">
                Email: <a href="mailto:studio@loveandphotos.com" className="text-blush-600 hover:text-blush-700 underline">studio@loveandphotos.com</a>
              </p>
            </section>

            {/* Acceptance */}
            <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
              <h2 className="text-xl font-display font-semibold text-dusty-900 mb-4">
                ACCEPTANCE:
              </h2>
              <p className="leading-relaxed text-dusty-700">
                By clicking the payment button, providing payment, or otherwise confirming your booking—and submitting payment—the Client acknowledges that they have read, understand, and agree to be bound by these Terms and Conditions in their entirety.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions