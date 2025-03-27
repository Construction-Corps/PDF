'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, InputNumber, Row, Col, message, Space } from 'antd';
import { CopyOutlined, PlusOutlined, MinusOutlined, HolderOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import Cleave from 'cleave.js/react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

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

const DragHandle = styled.div`
  cursor: move;
  color: #bfbfbf;
  transition: color 0.3s;
  &:hover {
    color: #666;
  }
`;

const type = 'DraggableFormItem';

const DraggableRow = ({ index, moveRow, children }) => {
  const ref = useRef();
  
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: type,
    collect: (monitor) => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward',
      };
    },
    drop: (item) => {
      moveRow(item.index, index);
    },
  });
  
  const [{ isDragging }, drag] = useDrag({
    type,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  drop(drag(ref));
  
  const opacity = isDragging ? 0.4 : 1;
  const rowStyle = {
    opacity,
    background: isOver ? '#f0f8ff' : 'white',
    transition: 'all 0.3s',
  };
  
  return (
    <div ref={ref} style={rowStyle}>
      {children}
    </div>
  );
};

const PaymentSchedule = () => {
  const [form] = Form.useForm();
  const [totalPercentage, setTotalPercentage] = useState(100);
  const [output, setOutput] = useState('');
  const cleaveRef = useRef(null);

  const initialValues = {
    paymentPhases: [
      {
        phase: 'Deposit',
        percentage: 10,
        dueText: 'Due upon acceptance',
      },
      {
        phase: 'Permit',
        percentage: 20,
        dueText: 'Due upon permit submission',
      },
      {
        phase: 'Project Complete',
        percentage: 34,
        dueText: 'When project is complete',
      }
    ]
  };

  useEffect(() => {
    form.setFieldsValue(initialValues);
    updateTotalPercentage();
  }, []);

  const updateTotalPercentage = () => {
    const paymentPhases = form.getFieldValue('paymentPhases') || [];
    const total = paymentPhases.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0);
    setTotalPercentage(total);
  };

  const calculatePayments = (values) => {
    const totalAmount = parseFloat(values.totalAmount.replace(/[$,]/g, ''));
    if (isNaN(totalAmount)) {
      message.error('Please enter a valid total amount');
      return;
    }

    if (totalPercentage !== 100) {
      message.error('Total percentage must equal 100%');
      return;
    }

    const phases = values.paymentPhases.map(phase => ({
      phase: phase.phase,
      amount: (totalAmount * phase.percentage / 100).toFixed(2),
      percentage: phase.percentage,
      dueText: phase.dueText
    }));

    const formattedOutput = phases.map(phase => 
      `${phase.percentage}% ${phase.phase} = $${parseFloat(phase.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} (${phase.dueText})`
    ).join('\n');

    setOutput(formattedOutput);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output)
      .then(() => message.success('Copied to clipboard!'))
      .catch(() => message.error('Failed to copy'));
  };
  
  const moveRow = (dragIndex, hoverIndex) => {
    const paymentPhases = form.getFieldValue('paymentPhases');
    const dragRow = paymentPhases[dragIndex];
    
    // Create a new array without the dragged item
    const newData = [...paymentPhases];
    newData.splice(dragIndex, 1);
    // Insert the dragged item at the target position
    newData.splice(hoverIndex, 0, dragRow);
    
    form.setFieldsValue({ paymentPhases: newData });
    updateTotalPercentage();
  };

  return (
    <PageContainer>
      <Container>
        <Title>Payment Breakdown</Title>
        <Form 
          form={form} 
          onFinish={calculatePayments}
          layout="vertical"
          initialValues={initialValues}
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

          <DndProvider backend={HTML5Backend}>
            <Form.List name="paymentPhases">
              {(fields, { add, remove }) => (
                <>
                  {fields.map((field, index) => (
                    <DraggableRow key={field.key} index={index} moveRow={moveRow}>
                      <ScheduleRow>
                        <Col span={1} style={{ display: 'flex', alignItems: 'center' }}>
                          <DragHandle>
                            <HolderOutlined />
                          </DragHandle>
                        </Col>
                        <Col span={6}>
                          <StyledFormItem
                            label="Phase"
                            name={[field.name, 'phase']}
                            rules={[{ required: true, message: 'Please enter phase' }]}
                          >
                            <Input placeholder="Phase Name" />
                          </StyledFormItem>
                        </Col>
                        <Col span={5}>
                          <StyledFormItem
                            label="Percentage"
                            name={[field.name, 'percentage']}
                            rules={[{ required: true, message: 'Please enter percentage' }]}
                          >
                            <InputNumber 
                              placeholder="Percentage" 
                              style={{ width: '100%' }} 
                              onChange={() => setTimeout(updateTotalPercentage, 0)}
                            />
                          </StyledFormItem>
                        </Col>
                        <Col span={8}>
                          <StyledFormItem
                            label="Due Text"
                            name={[field.name, 'dueText']}
                            rules={[{ required: true, message: 'Please enter due text' }]}
                          >
                            <Input placeholder="Due upon" />
                          </StyledFormItem>
                        </Col>
                        <Col span={4} style={{ display: 'flex', alignItems: 'flex-end' }}>
                          {index === 0 ? (
                            <Button 
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => add()}
                              style={{ marginBottom: '4px' }}
                            />
                          ) : (
                            <Button 
                              type="primary" 
                              danger 
                              icon={<MinusOutlined />}
                              onClick={() => {
                                remove(field.name);
                                setTimeout(updateTotalPercentage, 0);
                              }}
                              disabled={fields.length <= 2}
                              style={{ marginBottom: '4px' }}
                            />
                          )}
                        </Col>
                      </ScheduleRow>
                    </DraggableRow>
                  ))}
                </>
              )}
            </Form.List>
          </DndProvider>

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
              onClick={copyToClipboard}
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
