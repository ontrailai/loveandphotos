import { useEffect } from 'react'

const PrivacyPolicy = () => {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 to-blush-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12">
          <h1 className="text-4xl font-display font-bold text-dusty-900 mb-4">
            Privacy Policy for Love and Photos
          </h1>
          <p className="text-dusty-600 mb-8">Last Updated: February 03, 2025</p>

          <div className="space-y-8 text-dusty-700">
            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                1. Introduction
              </h2>
              <p className="leading-relaxed">
                Welcome to Love and Photos ("we," "us," "our"). We are committed to protecting your privacy and ensuring you have a positive experience on our website, <a href="https://loveandphotos.com/" className="text-blush-600 hover:text-blush-700 underline">https://loveandphotos.com/</a> ("Site"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our Site or otherwise interact with us. By accessing or using our Site, you agree to the terms of this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                2. Information We Collect
              </h2>
              <p className="mb-4 leading-relaxed">
                We may collect both personally identifiable information (PII) and non-personally identifiable information about you, including:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Personal Information:</strong> Such as your name, email address, phone number, and any other information you voluntarily provide when signing up, subscribing, or contacting us.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Usage Data:</strong> Information automatically collected when you visit our Site, including your IP address, browser type, operating system, referring URLs, pages viewed, and the dates/times of your visits.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Cookies and Similar Technologies:</strong> We may use cookies and similar tracking technologies to enhance your experience and analyze Site usage.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                3. How We Use Your Information
              </h2>
              <p className="mb-4 leading-relaxed">
                We use the information we collect for various purposes, including:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Providing Services:</strong> To operate, maintain, and improve our Site, and to provide you with the services and information you request.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Communication:</strong>
                    <div className="mt-2 ml-4">
                      <strong>Email and SMS Communications:</strong> If you opt in, we will send you email and SMS communications, which may include newsletters, marketing materials, updates, and promotional content. By opting in, you consent to receive such communications.
                    </div>
                    <div className="mt-2 ml-4">
                      <strong>Opt-Out Information:</strong> If you wish to stop receiving these communications, you can opt out at any time by unsubscribing using the link provided in the email or by replying "STOP" to any SMS message.
                    </div>
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Analytics and Improvements:</strong> To analyze trends, monitor site activity, and improve our offerings.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Legal Obligations:</strong> To comply with applicable legal requirements and protect the rights and safety of our users and the public.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                4. Sharing Your Information
              </h2>
              <p className="mb-4 leading-relaxed">
                We do not sell your personal information. We may share your information with third parties in the following circumstances:
              </p>
              <ul className="space-y-3 ml-6">
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Service Providers:</strong> With vendors and service providers who perform services on our behalf, such as website hosting, data analysis, payment processing, and communication services.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Legal Requirements:</strong> When required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business to another company, provided that the recipient agrees to handle your information in a manner consistent with this Privacy Policy.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                5. Data Retention
              </h2>
              <p className="leading-relaxed">
                We will retain your information for as long as necessary to fulfill the purposes outlined in this Privacy Policy unless a longer retention period is required or permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                6. Your Choices and Rights
              </h2>
              <ul className="space-y-3 ml-6">
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Opting In and Out:</strong> When you opt in to receive communications via email or SMS, you agree to receive such messages from us. To opt out of receiving email communications, please click the unsubscribe link included in our emails. To opt out of receiving SMS messages, reply "STOP" to any SMS message you receive from us.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Access and Correction:</strong> You may have the right to access, update, or correct your personal information. Please contact us at Matthew@loveandphotos.com to request any changes.
                  </div>
                </li>
                <li className="flex">
                  <span className="text-blush-500 mr-2">•</span>
                  <div>
                    <strong>Do Not Track Signals:</strong> Our Site does not currently respond to "Do Not Track" signals, but you can control cookies and other tracking technologies through your browser settings.
                  </div>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                7. Security
              </h2>
              <p className="leading-relaxed">
                We implement reasonable administrative, technical, and physical safeguards to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                8. Third-Party Links
              </h2>
              <p className="leading-relaxed">
                Our Site may contain links to third-party websites. This Privacy Policy does not apply to those websites. We encourage you to review the privacy policies of any third-party sites you visit.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                9. International Users
              </h2>
              <p className="leading-relaxed">
                If you are accessing our Site from outside the United States of America, please be aware that your information may be transferred to, stored, and processed in a country where the data protection laws may differ from those in your country.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                10. Changes to This Privacy Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this policy. We encourage you to review this Privacy Policy periodically to stay informed about how we are protecting your information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-display font-semibold text-dusty-900 mb-4">
                11. Contact Us
              </h2>
              <p className="leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="font-medium">
                <a href="mailto:Matthew@loveandphotos.com" className="text-blush-600 hover:text-blush-700 underline">
                  Matthew@loveandphotos.com
                </a>
              </p>
              <p className="mt-6 pt-6 border-t border-gray-200 leading-relaxed">
                By using our Site, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy