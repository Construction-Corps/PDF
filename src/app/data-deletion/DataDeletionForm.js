'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';

const DataDeletionForm = () => {
  const [submitted, setSubmitted] = useState(false);

  const onFinish = (values) => {
    console.log('Form submitted:', values);
    // Here you would typically send this data to your backend
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <Alert
        message="Request Submitted"
        description="Your data deletion request has been submitted. We will process your request and contact you via the email provided."
        type="success"
        showIcon
        style={{ marginTop: '30px' }}
      />
    );
  }

  return (
    <div style={{ marginTop: '30px' }}>
      <h3>Request Form</h3>
      <p>
        Alternatively, you can submit your request using the form below:
      </p>
      
      <Form
        name="dataDeletionForm"
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          label="Full Name"
          name="fullName"
          rules={[{ required: true, message: 'Please enter your full name' }]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input />
        </Form.Item>
        
        <Form.Item
          label="Additional Information"
          name="additionalInfo"
          help="Please provide any additional details that may help us identify your data"
        >
          <Input.TextArea rows={4} />
        </Form.Item>
        
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit Request
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default DataDeletionForm; 