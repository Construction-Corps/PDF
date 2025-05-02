'use client'

import { Typography } from 'antd';

const { Title, Paragraph } = Typography;

export default function SettingsIndexPage() {
  return (
    <div>
      <Title level={3}>Settings</Title>
      <Paragraph>
        Please select a settings category from the menu on the left.
      </Paragraph>
    </div>
  );
} 