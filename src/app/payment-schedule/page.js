'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, InputNumber, Row, Col, message } from 'antd';
import { CopyOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import Cleave from 'cleave.js/react';

const Container = styled.div`
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
`;

const Title = styled.h2`
  margin-bottom: 1.5rem;
  color: #333;
  font-weight: 500;
`;

const FormRow = styled(Row)`
  margin-bottom: 1rem;
  background: #fff;
  padding: 1rem;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
  transition: all 0.3s ease;

  &:hover {
    border-color: #d9d9d9;
    box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  }
`;

const StyledFormItem = styled(Form.Item)`
  margin: 0;
  flex: 1;
  
  .ant-form-item-label {
    padding-bottom: 0 !important;
    > label {
      font-size: 0.75rem;
      padding-bottom: 0 !important;
      color: #666;
      height: 16px;
      margin: 0;
    }
  }

  .ant-form-item-row {
    flex-direction: column;
    row-gap: 1px;
  }

  .ant-input {
    padding: 4px 11px;
    border-radius: 6px;
    border: 1px solid #d9d9d9;
    transition: all 0.3s;

    &:hover {
      border-color: #40a9ff;
    }

    &:focus {
      border-color: #40a9ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
    }
  }
`;

const Output = styled.div`
  margin-top: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #eee;

  p {
    margin-bottom: 0.5rem;
    font-size: 1rem;
    color: #333;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const TotalPercentage = styled.div`
  margin: 1rem 0;
  padding: 0.75rem;
  background: ${props => props.isValid ? '#f6ffed' : '#fff2f0'};
  border-radius: 4px;
  border: 1px solid ${props => props.isValid ? '#b7eb8f' : '#ffccc7'};
  color: ${props => props.isValid ? '#52c41a' : '#ff4d4f'};
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  margin-top: 1.5rem;
  display: flex;
  gap: 1rem;
`;

const PageContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  padding: 24px;
`;

const ScheduleRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ScheduleContainer = styled.div`
  background: white;
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: #666;
`;

const PaymentSchedule = () => {
  const [form] = Form.useForm();
  const [rows, setRows] = useState([
    {
      phase: 'Deposit',
      percentage: 50,
      dueText: 'Due upon acceptance',
      key: 'initial-1'
    },
    {
      phase: 'Project Complete',
      percentage: 50,
      dueText: 'When project is complete',
      key: 'initial-2'
    }
  ]);
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [output, setOutput] = useState('');
  const cleaveRef = useRef(null);

  const updateDuePlaceholder = (index, phaseValue) => {
    const newRows = [...rows];
    if (!newRows[index].dueText || newRows[index].dueText.includes('Due upon ')) {
      newRows[index].dueText = `Due upon ${phaseValue} `
      // + `start`;
      setRows(newRows);
    }
  };

  const adjustPercentages = () => {
    const sum = rows.reduce((acc, row) => acc + (row.percentage || 0), 0);
    setTotalPercentage(sum);
  };

  const addRow = () => {
    const newRow = {
      phase: '',
      percentage: 0,
      dueText: '',
      key: `row-${Date.now()}`
    };
    
    // Insert before the last row (Project Complete)
    const newRows = [...rows];
    newRows.splice(rows.length - 1, 0, newRow);
    setRows(newRows);
    adjustPercentages();
  };

  const removeRow = (index) => {
    const newRows = rows.filter((_, i) => i !== index);
    setRows(newRows);
    adjustPercentages();
  };

  const calculatePayments = (values) => {
    if (totalPercentage !== 100) {
      message.error('The total percentage must equal 100%');
      return;
    }

    const totalAmount = parseFloat(values.totalAmount.replace(/[$,]/g, ''));
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    const calculatedOutput = rows.map(row => {
      const amount = (row.percentage / 100) * totalAmount;
      return `${row.percentage}% ${row.phase} = ${formatter.format(amount)} (${row.dueText})`;
    }).join('\n');

    setOutput(calculatedOutput);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
      .then(() => message.success('Copied to clipboard!'))
      .catch(() => message.error('Error copying to clipboard.'));
  };

  const handleRowChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    if (field === 'phase') {
      updateDuePlaceholder(index, value);
    }
    if (field === 'percentage') {
      adjustPercentages();
    }
    setRows(newRows);
  };

  return (
    <PageContainer>
      <Container>
        <Title>Payment Breakdown</Title>
        <Form 
          form={form} 
          onFinish={calculatePayments}
          layout="vertical"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Label>Total Amount</Label>
            <StyledFormItem
              name="totalAmount"
              rules={[{ required: true, message: 'Please enter total amount' }]}
            >
              <Cleave
                options={{
                  numeral: true,
                  numeralThousandsGroupStyle: 'thousand',
                  prefix: '$',
                  numeralDecimalScale: 2,
                  numeralPositiveOnly: true,
                  rawValueTrimPrefix: true
                }}
                className="ant-input"
                ref={cleaveRef}
                placeholder="Enter total amount"
                style={{ width: '100%' }}
              />
            </StyledFormItem>
          </div>

          {rows.map((row, index) => (
            <ScheduleRow key={row.key}>
              <Col span={6}>
                <StyledFormItem
                  label="Phase"
                  required
                >
                  <Input
                    value={row.phase}
                    onChange={(e) => handleRowChange(index, 'phase', e.target.value)}
                    placeholder="Phase Name"
                  />
                </StyledFormItem>
              </Col>
              <Col span={6}>
                <StyledFormItem
                  label="Percentage"
                  required
                >
                  <InputNumber
                    value={row.percentage}
                    onChange={(value) => handleRowChange(index, 'percentage', value)}
                    placeholder="Percentage"
                    style={{ width: '100%' }}
                  />
                </StyledFormItem>
              </Col>
              <Col span={8}>
                <StyledFormItem
                  label="Due Text"
                  required
                >
                  <Input
                    value={row.dueText}
                    onChange={(e) => handleRowChange(index, 'dueText', e.target.value)}
                    placeholder="Due upon"
                  />
                </StyledFormItem>
              </Col>
              <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                {index === rows.length - 1 ? (
                  <Button 
                    type="primary" 
                    danger 
                    icon={<MinusOutlined />}
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 2}
                    style={{ marginBottom: '4px' }}
                  />
                ) : (
                  <Button 
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={addRow}
                    style={{ marginBottom: '4px' }}
                  />
                )}
              </Col>
            </ScheduleRow>
          ))}

          <TotalPercentage isValid={totalPercentage === 100}>
            Total Percentage: {totalPercentage}%
          </TotalPercentage>

          <ButtonGroup>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
            >
              Calculate
            </Button>
            <Button 
              type="default" 
              onClick={addRow}
              size="large"
              icon={<PlusOutlined />}
            >
              Add Row
            </Button>
          </ButtonGroup>
        </Form>

        {output && (
          <>
            <Output>
              {output.split('\n').map((line, index) => (
                <p key={index}>{line}</p>
              ))}
            </Output>

            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopy}
              style={{ marginTop: '1rem' }}
              type="default"
              size="large"
            >
              Copy to Clipboard
            </Button>
          </>
        )}
      </Container>
    </PageContainer>
  );
};

export default PaymentSchedule;
