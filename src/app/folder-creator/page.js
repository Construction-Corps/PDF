'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, Input, Button, message, Space, Spin, Alert } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { fetchJobTread } from '../../utils/JobTreadApi'; // Assuming this path is correct

const Container = styled.div`
  max-width: 600px;
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

const FolderCreator = () => {
  const [form] = Form.useForm();
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch jobs for the select dropdown
  const fetchJobsList = useCallback(async () => {
    setLoadingJobs(true);
    setError(null);
    try {
      const jobsQuery = {
        "organization": {
          "id": {},
          "jobs": {
            "$": {
              "size": 500, // Adjust size as needed, or implement pagination if list is very long
              "sortBy": [
                {
                  "field": "name",
                  "order": "asc"
                }
              ],
              "where": {
                  "and": [
                      ["closedOn", "=", null] // Only show open jobs
                  ]
              }
            },
            "nodes": {
              "id": {},
              "name": {}
            }
          }
        }
      };
      const data = await fetchJobTread(jobsQuery);
      if (data?.organization?.jobs?.nodes) {
        setJobs(data.organization.jobs.nodes);
      } else {
        throw new Error("Failed to fetch jobs list.");
      }
    } catch (err) {
      console.error("Fetching jobs failed:", err);
      setError("Could not load jobs. Please try refreshing.");
      message.error("Failed to load jobs list.");
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => {
    fetchJobsList();
  }, [fetchJobsList]);

  // Handle form submission
  const onFinish = async (values) => {
    console.log('Received values of form:', values);
    setSubmitting(true);
    setError(null);

    const { jobId, folders } = values;
    const folderNames = folders.map(f => f.name).filter(name => name && name.trim() !== '');

    if (!jobId) {
        message.error('Please select a job.');
        setSubmitting(false);
        return;
    }

    if (folderNames.length === 0) {
        message.error('Please add at least one folder name.');
        setSubmitting(false);
        return;
    }

    try {
        // Using fetch API directly as we don't have a specific update function for this yet
        const response = await fetch('/jobtread/add-folders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                job_id: jobId,
                folders: folderNames,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Server responded with status ${response.status}`);
        }

        message.success('Folders added successfully!');
        form.resetFields(['folders']); // Optionally reset folder fields

    } catch (err) {
        console.error('Failed to add folders:', err);
        setError(`Failed to add folders: ${err.message}`);
        message.error(`Failed to add folders: ${err.message}`);
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <Container>
      <Title>Create Job Folders</Title>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
      <Form
        form={form}
        name="folder_creator"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item
          name="jobId"
          label="Select Job"
          rules={[{ required: true, message: 'Please select a job!' }]}
        >
          <Select
            showSearch
            placeholder="Select a job"
            loading={loadingJobs}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={jobs.map(job => ({ value: job.id, label: job.name }))}
          />
        </Form.Item>

        <Form.List
          name="folders"
          initialValue={[{ name: '' }]} // Start with one empty folder field
        >
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Missing folder name' }]}
                    style={{ flexGrow: 1 }}
                  >
                    <Input placeholder="Folder Name" />
                  </Form.Item>
                  {fields.length > 1 ? (
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  ) : null}
                </Space>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Folder Field
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Create Folders
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
};

export default FolderCreator; 