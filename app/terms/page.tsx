import React from 'react';

export const metadata = {
  title: 'Terms & Conditions | MyUniversitys',
  description: 'Terms and Conditions for using the MyUniversitys application.',
};

export default function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-lg rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 border-b pb-4">Terms & Conditions</h1>
        
        <div className="text-gray-700 space-y-6">
          <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
          
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By downloading, browsing, or using the MyUniversitys mobile application or website (the &quot;App&quot;), you agree to comply with and be bound by these Terms & Conditions. 
              If you do not agree to these terms, you must abstain from using the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. User Accounts & Registration</h2>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>To access certain features of the App, including the referral and wallet systems, you must register for an account.</li>
              <li>You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.</li>
              <li>You are responsible for safeguarding your password and for all activities that occur under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account or any other breach of security.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Referral Program & Payouts</h2>
            <p>Our App includes a referral program where you can earn rewards for inviting new users or securing real admissions. The following rules apply:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li><strong>Valid Referrals:</strong> A referral is only considered valid if the referred individual registers using your unique code and meets all other qualifying criteria defined in the App.</li>
              <li><strong>Fraud Prevention:</strong> Any attempt to artificially inflate your referrals, create fake accounts, or exploit the system will result in immediate termination of your account and forfeiture of any pending payouts.</li>
              <li><strong>Processing Time:</strong> Rewards will be credited to your internal wallet. Withdrawal requests to your bank account will be processed in accordance with the timelines established within the App interface.</li>
              <li><strong>Bank Details:</strong> You are responsible for ensuring your bank details are accurate. We are not liable for payouts sent to incorrect accounts due to user error.</li>
              <li><strong>Minimum Withdrawal limits:</strong> Withdrawal requests must meet the minimum threshold displayed in your Wallet page.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Acceptable Use Policy</h2>
            <p>You agree not to use the App in any way that:</p>
            <ul className="list-disc pl-6 mt-2 space-y-2">
              <li>Is unlawful, illegal, fraudulent, or harmful.</li>
              <li>Attempts to breach any security tracking or authentication mechanisms.</li>
              <li>Involves the transmission of any unsolicited or unauthorized advertising or promotional material.</li>
              <li>Offends, defames, harasses, or discriminates against any user or third party.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Intellectual Property</h2>
            <p>
              The App and its original content, features, and functionality are owned by MyUniversitys and are protected by international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Limitation of Liability</h2>
            <p>
              In no event shall MyUniversitys, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the App.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Modifications to Terms</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes a material change will be determined at our sole discretion. 
              By continuing to access or use our App after those revisions become effective, you agree to be bound by the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
