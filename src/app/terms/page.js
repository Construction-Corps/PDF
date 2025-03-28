import React from 'react';
import { Card } from 'antd';

export const metadata = {
  title: 'Terms of Service | JobTread Tools',
  description: 'Terms of Service for Construction Corps JobTread Tools',
};

export default function Terms() {
  return (
    <div style={{ padding: '50px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card style={{ padding: '20px' }}>
        <h1>Terms of Service</h1>
        <p>Last Updated: {new Date().toLocaleDateString()}</p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using our JobTread Tools application (a third-party enhancement for JobTread software), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this service.
        </p>

        <h2>2. Relationship with JobTread</h2>
        <p>
          Construction Corps JobTread Tools is an independent third-party application that works with JobTread software. Important clarifications:
        </p>
        <ul>
          <li>We are not affiliated with, endorsed by, or officially connected to JobTread Software</li>
          <li>This application is developed by Construction Corps to enhance JobTread functionality</li>
          <li>JobTread may modify their API or services in ways that affect our application's functionality</li>
          <li>We are not responsible for any JobTread service disruptions or changes</li>
          <li>Your use of JobTread itself is governed by JobTread's own terms of service</li>
        </ul>

        <h2>3. WhatsApp Business API Usage</h2>
        <p>
          Our application incorporates WhatsApp Business API functionality. By using these features, you:
        </p>
        <ul>
          <li>Consent to our processing of message content and contact information</li>
          <li>Agree to use the WhatsApp integration in compliance with WhatsApp's Business Solution Policy</li>
          <li>Understand that WhatsApp/Meta may collect and process additional data according to their policies</li>
          <li>Will not use our WhatsApp integration for unauthorized marketing, spam, or prohibited content</li>
          <li>Acknowledge that WhatsApp services within our application may change based on WhatsApp's policies</li>
        </ul>

        <h2>4. Use License</h2>
        <p>
          Permission is granted to temporarily use this application for personal or business purposes. This is the grant of a license, not a transfer of title, and under this license you may not:
        </p>
        <ul>
          <li>Modify or copy the materials</li>
          <li>Use the materials for any commercial purpose other than as intended</li>
          <li>Attempt to decompile or reverse engineer any software contained in the application</li>
          <li>Remove any copyright or other proprietary notations from the materials</li>
          <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
        </ul>

        <h2>5. Disclaimer</h2>
        <p>
          The materials on our application are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
        </p>

        <h2>6. Limitations</h2>
        <p>
          In no event shall Construction Corps or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use our application, even if we or our authorized representatives have been notified orally or in writing of the possibility of such damage.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          Our application relies on third-party services including but not limited to JobTread and WhatsApp. We are not responsible for:
        </p>
        <ul>
          <li>Changes to JobTread's API that affect our application's functionality</li>
          <li>WhatsApp service disruptions or policy changes that impact our WhatsApp integration</li>
          <li>Data handling practices of these third-party services</li>
        </ul>

        <h2>8. Accuracy of Materials</h2>
        <p>
          The materials appearing on our application could include technical, typographical, or photographic errors. We do not warrant that any of the materials on our application are accurate, complete or current. We may make changes to the materials contained on our application at any time without notice.
        </p>

        <h2>9. Links</h2>
        <p>
          We have not reviewed all of the sites linked to our application and are not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by us of the site. Use of any such linked website is at the user's own risk.
        </p>

        <h2>10. Modifications</h2>
        <p>
          We may revise these terms of service for our application at any time without notice. By using this application you are agreeing to be bound by the then current version of these terms of service.
        </p>

        <h2>11. Governing Law</h2>
        <p>
          These terms and conditions are governed by and construed in accordance with the laws of the United States and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
        </p>

        <h2>12. Contact Us</h2>
        <p>If you have any questions about these Terms of Service, please contact us at:</p>
        <p><strong>Email:</strong> legal@constructioncorps.com</p>
      </Card>
    </div>
  );
} 