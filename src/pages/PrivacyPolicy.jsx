import { useEffect } from 'react'

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card rounded-lg shadow-lg p-8 sm:p-12 border">
          <h1 className="text-4xl font-display font-bold text-foreground mb-4">
            Privacy Policy for Love & Photos
          </h1>
          <p className="text-muted-foreground mb-8">Last Updated: October 7, 2025</p>

          <div className="space-y-8 text-muted-foreground">
            {/* Section 1: Introduction */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                1. Introduction
              </h2>
              <p className="leading-relaxed mb-4">
                Welcome to Love & Photos ("we," "us," "our"). We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and protect information through our website (<a href="https://loveandphotos.com/" className="text-primary hover:text-primary/80 underline">https://loveandphotos.com/</a> and related services) (the "Site") and via accounts or profiles that clients and talent may create.
              </p>
              <p className="leading-relaxed">
                By accessing or using our Site or creating an account or profile, you acknowledge that you have read, understood, and agreed to this Privacy Policy and our Terms of Service. If you do not agree, you must not use our Site or services.
              </p>
            </section>

            {/* Section 2: Scope and Applicability */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                2. Scope and Applicability
              </h2>
              <p className="leading-relaxed mb-4">
                This Privacy Policy applies to all users of the Site, including visitors, clients, talent, and anyone who creates or manages an account or profile. It also covers any offline data we may collect.
              </p>
              <p className="leading-relaxed">
                If you are a California resident or live in a state with privacy laws (such as under the CCPA, CPRA, or similar regulations), additional rights may apply as described in Section 10.
              </p>
            </section>

            {/* Section 3: Information We Collect */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                3. Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                3.1 Personal Information (PII)
              </h3>
              <p className="leading-relaxed mb-4">
                When you create an account or profile, book services, or otherwise interact with us, we may collect:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="flex"><span className="text-primary mr-2">•</span><div>Name, email address, phone number, and mailing address</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Date of birth or age (if required)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Profile photos, portfolio or media content (images/videos)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Payment details (via secure third-party processors)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Biographical or descriptive information (such as experience, location, or service offerings)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Communications and feedback you send us</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Any information you voluntarily provide (preferences, links, or social media handles)</div></li>
              </ul>
              <p className="leading-relaxed mb-4 italic">
                Users are solely responsible for ensuring that any information, photos, or content they upload or submit through their accounts do not infringe on the rights or privacy of others. We reserve the right to remove or disable access to any content that violates our Terms or applicable law.
              </p>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                3.2 Usage, Technical, and Non-Personal Information
              </h3>
              <p className="leading-relaxed mb-4">
                We may automatically collect:
              </p>
              <ul className="space-y-2 ml-6">
                <li className="flex"><span className="text-primary mr-2">•</span><div>IP address and device identifiers</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Browser type, version, and operating system</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Referring URLs, pages visited, clicks, timestamps</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Cookies, pixels, and tracking technologies</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Aggregate or anonymized analytics data</div></li>
              </ul>
            </section>

            {/* Section 4: How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                4. How We Use Your Information
              </h2>
              <p className="leading-relaxed mb-4">
                We use collected information for purposes including:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="flex"><span className="text-primary mr-2">•</span><div>Managing your account or profile</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Facilitating bookings, communication, and transactions</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Processing payments, refunds, and fraud prevention</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Sending transactional notifications and account updates</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Sending marketing or promotional communications (if you opt in)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Analyzing and improving our Site, systems, and offerings</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Enforcing our Terms of Service and resolving disputes</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Fulfilling legal, tax, or regulatory obligations</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Maintaining accurate records for audits or business operations</div></li>
              </ul>
              <p className="leading-relaxed">
                We may also use anonymized or aggregated data to train internal systems, improve automation, or enhance our matching algorithms, but such data will not identify individuals.
              </p>
            </section>

            {/* Section 5: Sharing and Disclosures */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                5. Sharing and Disclosures
              </h2>
              <p className="leading-relaxed mb-4">
                We do not sell personal information. We may share or disclose information under these circumstances:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Service Providers:</strong> With trusted vendors who provide hosting, analytics, payment processing, communication, or support on our behalf, under confidentiality agreements.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Business Transfers:</strong> As part of a merger, acquisition, financing, or sale of assets, provided the new entity honors this Privacy Policy.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Legal Requirements:</strong> To comply with legal requests, subpoenas, or regulatory authorities.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Fraud and Safety:</strong> To protect against misuse, fraud, or harm to users or the public.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Professional Advisors:</strong> With attorneys, accountants, or insurers for compliance, risk management, or defense of claims.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Client-Talent Fulfillment:</strong> We may share limited details (such as name, email, and event information) between clients and talent solely for completing confirmed bookings.</div>
                </li>
                <li className="flex">
                  <span className="text-primary mr-2">•</span>
                  <div><strong>Aggregate or De-Identified Data:</strong> We may share non-identifiable data for analytics or reporting.</div>
                </li>
              </ul>
            </section>

            {/* Section 6: User-Generated Content */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                6. User-Generated Content
              </h2>
              <p className="leading-relaxed mb-4">
                Users who upload photos, videos, text, reviews, or other materials ("Content") grant us a non-exclusive, worldwide, royalty-free license to host, display, and use such Content solely for the purpose of operating the platform, fulfilling bookings, and marketing their own services through the Site.
              </p>
              <p className="leading-relaxed mb-4">
                By submitting a review and/or uploading photos or video as part of a review, you agree that your review, words, comments, photos, or videos may be displayed publicly on the Site, in marketing materials, or other public-facing areas at our discretion.
              </p>
              <p className="leading-relaxed">
                Users represent and warrant that they own or have rights to all uploaded Content. We are not responsible for any misuse, infringement, or unauthorized use of such Content by other users or third parties. We reserve the right to remove or disable access to any Content that violates our Terms, this Privacy Policy, or applicable law.
              </p>
            </section>

            {/* Section 7: Data Retention and Deletion */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                7. Data Retention and Deletion
              </h2>
              <p className="leading-relaxed mb-4">
                We retain information as long as needed to provide services, comply with legal obligations, or resolve disputes. Once data is no longer necessary, we securely delete or anonymize it.
              </p>
              <p className="leading-relaxed">
                If you delete your account, we will remove or anonymize your personal data, except where retention is required for legal, accounting, or fraud prevention purposes.
              </p>
            </section>

            {/* Section 8: Your Privacy Rights and Choices */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                8. Your Privacy Rights and Choices
              </h2>
              <p className="leading-relaxed mb-4">
                Depending on your jurisdiction, you may have rights to:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="flex"><span className="text-primary mr-2">•</span><div>Access the data we hold about you</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Request correction or deletion of your data</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Object to data processing</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Request data portability</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>Withdraw consent at any time</div></li>
              </ul>
              <p className="leading-relaxed">
                To exercise your rights, contact us at <a href="mailto:support@lp.loveandphotos.com" className="text-primary hover:text-primary/80 underline">support@lp.loveandphotos.com</a>. We may verify your identity before acting on a request.
              </p>
            </section>

            {/* Section 9: Cookies and Tracking Technologies */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                9. Cookies and Tracking Technologies
              </h2>
              <p className="leading-relaxed">
                We use cookies to personalize content, analyze traffic, and improve services. You can control cookie preferences through your browser settings.
              </p>
            </section>

            {/* Section 10: State Privacy Rights */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                10. State Privacy Rights (California and Others)
              </h2>
              <p className="leading-relaxed mb-4">
                If you are a California resident, you have additional rights under the CCPA and CPRA, including:
              </p>
              <ul className="space-y-2 ml-6 mb-4">
                <li className="flex"><span className="text-primary mr-2">•</span><div>The right to know what data we collect and how it's used</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>The right to request deletion or correction of your data</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>The right to opt out of data sale or sharing (we do not sell your data)</div></li>
                <li className="flex"><span className="text-primary mr-2">•</span><div>The right to non-discrimination for exercising these rights</div></li>
              </ul>
              <p className="leading-relaxed">
                We review and update this Privacy Policy at least once every 12 months to stay compliant with changing laws.
              </p>
            </section>

            {/* Section 11: Security */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                11. Security
              </h2>
              <p className="leading-relaxed">
                We use encryption, access controls, and secure servers to protect your data. While we take strong precautions, no system is completely secure. By using the Site, you agree that we are not liable for unauthorized access, disclosure, or loss of data arising from circumstances beyond our reasonable control.
              </p>
            </section>

            {/* Section 12: Data Breach Response */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                12. Data Breach Response
              </h2>
              <p className="leading-relaxed">
                In the event of a data breach, we will promptly investigate, contain, and notify affected users and regulators as required by law. We may take additional steps such as password resets, access restrictions, or temporary account suspensions to protect your data.
              </p>
            </section>

            {/* Section 13: Third-Party Links and Integrations */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                13. Third-Party Links and Integrations
              </h2>
              <p className="leading-relaxed">
                Our Site may contain links or integrations with third-party services (such as scheduling tools, analytics, or marketing platforms). Those providers operate under their own privacy policies, and we are not responsible for their practices.
              </p>
            </section>

            {/* Section 14: Recordkeeping and Legal Hold */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                14. Recordkeeping and Legal Hold
              </h2>
              <p className="leading-relaxed">
                We may retain transaction or communication records even after account deletion where legally necessary, including for fraud prevention, audits, or enforcement of agreements.
              </p>
            </section>

            {/* Section 15: International Data Transfers */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                15. International Data Transfers
              </h2>
              <p className="leading-relaxed">
                If you access our Site from outside the United States, you consent to your information being transferred and processed in the United States or other jurisdictions where we operate. We rely on standard contractual clauses or equivalent safeguards to protect transferred data.
              </p>
            </section>

            {/* Section 16: Children's Privacy */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                16. Children's Privacy
              </h2>
              <p className="leading-relaxed">
                Our services are not directed at individuals under 13, and we do not knowingly collect data from minors. If we discover such data, it will be deleted promptly unless retention is legally required. We comply with COPPA and any stricter local laws.
              </p>
            </section>

            {/* Section 17: Indemnification */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                17. Indemnification
              </h2>
              <p className="leading-relaxed">
                You agree to indemnify, defend, and hold harmless Love & Photos, its owners, employees, contractors, and affiliates from any claims, damages, liabilities, or expenses (including legal fees) arising from your use of the Site, your content, or your violation of this Privacy Policy or applicable law.
              </p>
            </section>

            {/* Section 18: Dispute Resolution and Governing Law */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                18. Dispute Resolution and Governing Law
              </h2>
              <p className="leading-relaxed">
                This Privacy Policy and related disputes are governed by the laws of the State of California, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration in California under the rules of the American Arbitration Association. You waive any right to participate in a class action or jury trial.
              </p>
            </section>

            {/* Section 19: Miscellaneous */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                19. Miscellaneous
              </h2>
              <p className="leading-relaxed">
                If any provision of this Privacy Policy is held invalid, the remaining terms will continue in full force. This policy supersedes all previous versions. Continued use of the Site after updates constitutes acceptance of the revised terms.
              </p>
            </section>

            {/* Section 20: Contact Us */}
            <section>
              <h2 className="text-2xl font-display font-semibold text-foreground mb-4">
                20. Contact Us
              </h2>
              <p className="leading-relaxed mb-4">
                For questions, concerns, or privacy requests, contact:
              </p>
              <div className="space-y-2">
                <p className="font-medium">
                  Email: <a href="mailto:support@lp.loveandphotos.com" className="text-primary hover:text-primary/80 underline">support@lp.loveandphotos.com</a>
                </p>
                <p className="font-medium">Business Name: Love & Photos LLC</p>
                <p className="font-medium">Location: California, United States</p>
              </div>
              <p className="mt-6 pt-6 border-t border-border leading-relaxed">
                By using Love & Photos, you agree to this Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy
