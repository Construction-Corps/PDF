import React from 'react';
import { Card } from 'antd';
import DataDeletionForm from './DataDeletionForm';

export const metadata = {
  title: 'Data Deletion Request | JobTread Tools',
  description: 'Request deletion of your data from Construction Corps JobTread Tools',
};

export default function DataDeletion() {
  return (
    <div style={{ padding: '50px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card style={{ padding: '20px' }}>
        <h1>Data Deletion Request</h1>
        <p>
          In accordance with data protection regulations, you have the right to request the deletion of your personal data from our third-party JobTread Tools application.
        </p>

        <h2>Types of Data We May Hold</h2>
        <p>
          Our application may store the following types of data that can be deleted upon request:
        </p>
        <ul>
          <li>Your account information and preferences for our application</li>
          <li>Cached JobTread data that we've retrieved through the JobTread API</li>
          <li>WhatsApp message history and contact information related to our WhatsApp integration</li>
          <li>Usage analytics and interaction history with our application</li>
        </ul>
        
        <h2>Important Note About Third-Party Data</h2>
        <p>
          Please be aware that:
        </p>
        <ul>
          <li>We can only delete data stored within our own systems</li>
          <li>This deletion will not affect your primary JobTread account data - for that, you must contact JobTread directly</li>
          <li>WhatsApp/Meta may retain message data according to their own data retention policies</li>
        </ul>

        <h2>How to Request Data Deletion</h2>
        <p>
          To request the deletion of your personal data, please send an email to <strong>privacy@constructioncorps.com</strong> with the following information:
        </p>
        
        <ul>
          <li>Subject line: "Data Deletion Request"</li>
          <li>Your full name</li>
          <li>Your email address associated with your account</li>
          <li>Your phone number if you've used our WhatsApp integration</li>
          <li>Any additional information that can help us identify your data</li>
        </ul>

        <h2>What Happens Next</h2>
        <p>
          Upon receiving your request, we will:
        </p>
        
        <ol>
          <li>Verify your identity to ensure we're handling your data appropriately</li>
          <li>Locate all instances of your personal data in our systems</li>
          <li>Delete your data from our application databases, including any stored WhatsApp communication history</li>
          <li>Remove any cached JobTread data associated with your account</li>
          <li>Provide confirmation once your data has been deleted from our systems</li>
        </ol>

        <h2>Timeframe</h2>
        <p>
          We aim to respond to all data deletion requests within 30 days. In some cases, we may need additional time to verify your identity or locate all instances of your data, in which case we will keep you informed of our progress.
        </p>

        <h2>Exceptions</h2>
        <p>
          In some cases, we may be legally required to retain certain information, such as:
        </p>
        
        <ul>
          <li>Information needed for legal or accounting purposes</li>
          <li>Information related to active contracts or business relationships</li>
          <li>Information we are legally obligated to maintain</li>
          <li>Aggregated analytics data where your information is no longer personally identifiable</li>
        </ul>

        <p>
          If any exceptions apply to your request, we will explain what information we need to retain and why.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about the data deletion process, please contact our Data Protection Officer at:
        </p>
        <p>
          <strong>Email:</strong> privacy@constructioncorps.com
        </p>

        <DataDeletionForm />
      </Card>
    </div>
  );
} 