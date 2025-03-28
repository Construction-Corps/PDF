import React from 'react';
import { Card } from 'antd';

export const metadata = {
  title: 'Privacy Policy | JobTread Tools',
  description: 'Privacy Policy for Construction Corps JobTread Tools',
};

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '50px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card style={{ padding: '20px' }}>
        <h1>Privacy Policy</h1>
        <p>Last Updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Introduction</h2>
        <p>
          Welcome to Construction Corps JobTread Tools. This is a third-party application developed by Construction Corps to enhance your experience with JobTread software. We are not affiliated with, endorsed by, or officially connected to JobTread Software. We respect your privacy and are committed to protecting your personal data.
        </p>

        <h2>2. Data We Collect</h2>
        <p>We may collect the following types of information:</p>
        <ul>
          <li><strong>Personal identification information:</strong> Including but not limited to name, email address, and phone number.</li>
          <li><strong>JobTread data:</strong> Information retrieved from JobTread through their API, including job details, addresses, customer information, and project details.</li>
          <li><strong>WhatsApp communication data:</strong> If you opt to use our WhatsApp integration features, we process message content, delivery status, and contact information as required for the WhatsApp Business API functionality.</li>
          <li><strong>Usage data:</strong> Information about how you use our website and services.</li>
        </ul>

        <h2>3. WhatsApp API Usage</h2>
        <p>
          Our application integrates with the WhatsApp Business API to provide communication features. When using these features:
        </p>
        <ul>
          <li>We process message content and metadata necessary to facilitate communication</li>
          <li>Your phone number and contact information are used to establish WhatsApp connections</li>
          <li>Message history may be stored to provide context for ongoing communications</li>
          <li>We adhere to WhatsApp's Business API terms of service and data policies</li>
          <li>Meta (WhatsApp's parent company) may collect additional data according to their privacy policy</li>
        </ul>

        <h2>4. How We Use Your Data</h2>
        <p>We use your data to:</p>
        <ul>
          <li>Provide and maintain our third-party JobTread Tools service</li>
          <li>Facilitate communication through the WhatsApp Business API</li>
          <li>Display and manage JobTread information in our custom interfaces</li>
          <li>Notify you about changes to our service</li>
          <li>Provide customer support</li>
          <li>Monitor usage of our service</li>
          <li>Detect, prevent and address technical issues</li>
        </ul>

        <h2>5. Relationship with JobTread</h2>
        <p>
          This application is an independent tool developed by Construction Corps to work with JobTread software. We are not affiliated with JobTread LLC. Our application:
        </p>
        <ul>
          <li>Accesses JobTread data only with your permission and authentication</li>
          <li>Processes JobTread information to provide enhanced visualizations and features</li>
          <li>Does not modify your core JobTread data without your explicit action</li>
          <li>Is subject to JobTread's API usage policies and limitations</li>
        </ul>
        <p>
          For questions regarding JobTread's own data practices, please refer to JobTread's privacy policy.
        </p>

        <h2>6. Data Storage and Security</h2>
        <p>
          Your data is securely stored and we implement appropriate security measures to protect against unauthorized access. We store WhatsApp communication data only as long as necessary to provide our services.
        </p>

        <h2>7. Your Data Protection Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct your personal data</li>
          <li>Request erasure of your personal data (including WhatsApp message history we maintain)</li>
          <li>Object to processing of your personal data</li>
          <li>Request restriction of processing your personal data</li>
          <li>Request transfer of your personal data</li>
          <li>Withdraw consent</li>
        </ul>

        <h2>8. Cookies</h2>
        <p>We use cookies to improve your experience on our website. You can set your browser to refuse all or some browser cookies, or to alert you when websites set or access cookies.</p>

        <h2>9. Changes to This Privacy Policy</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.</p>

        <h2>10. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p><strong>Email:</strong> privacy@constructioncorps.com</p>
      </Card>
    </div>
  );
} 