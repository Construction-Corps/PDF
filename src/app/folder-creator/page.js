'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Form, Select, Input, Button, message, Space, Spin, Alert, Radio } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { fetchJobTread } from '../../utils/JobTreadApi'; // Assuming this path is correct
import { useRouter } from 'next/navigation'; // Import useRouter for redirection

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://ccbe.onrender.com';

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
  const [targetType, setTargetType] = useState('job'); // 'job' or 'vendor'
  const [jobs, setJobs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter(); // Initialize router

  // Fetch jobs for the select dropdown
  const fetchJobsList = useCallback(async () => {
    setLoadingJobs(true);
    setError(null);
    let allJobs = [];
    let nextPage = null; // Start with no page specified for the first request
    let hasMore = true;

    try {
      while (hasMore) {
        const jobsQuery = {
          "organization": {
            "id": {},
            "jobs": {
              "$": {
                "size": 100,
                ...(nextPage && { "page": nextPage }), // Conditionally add page
                "sortBy": [
                  {
                    "field": "name",
                    "order": "asc"
                  }
                ],
                "where": {
                    "and": [
                        ["closedOn", "=", null],
                    ]
                }
              },
              "nextPage": {},
              "nodes": {
                "id": {},
                "name": {}
              }
            }
          }
        };

        const data = await fetchJobTread(jobsQuery);
        const jobData = data?.organization?.jobs;

        if (jobData?.nodes) {
          allJobs = allJobs.concat(jobData.nodes);
        } else if (nextPage === null) { // Only warn if the *first* fetch fails or is empty
            console.warn("No jobs found or failed to fetch initial jobs list.");
            // No need to break here, nextPage will remain null, terminating the loop
        }

        // Update nextPage for the next iteration or stop if null/undefined
        nextPage = jobData?.nextPage;
        hasMore = !!nextPage; // Continue if nextPage has a value

      }
       setJobs(allJobs);
       if (allJobs.length === 0 && error === null) {
           // Optional: Set a specific message if no open jobs were found after pagination
           // setError("No open jobs found.");
           console.warn("Finished fetching jobs: No open jobs found.");
       }

    } catch (err) {
      console.error("Fetching jobs failed:", err);
      setError("Could not load jobs. Please try again later.");
      setJobs([]); // Clear jobs on error
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  // Fetch vendors for the select dropdown
  const fetchVendorsList = useCallback(async () => {
    setLoadingVendors(true);
    setError(null);
    let allVendors = [];
    let nextPage = null;
    let hasMore = true;

    try {
        while (hasMore) {
            const vendorsQuery = {
                "organization": {
                "id": {},
                "accounts": {
                    "$": {
                    ...(nextPage && { "page": nextPage }), // Conditionally add page
                    "where": [
                        "type",
                        "=",
                        "vendor"
                    ],
                    "size": 100 // Using 100 like jobs for consistency, adjust if needed
                    },
                    "nextPage": {},
                    "nodes": {
                    "id": {},
                    "type": {},
                    "name": {}
                    }
                }
                }
            };

            const data = await fetchJobTread(vendorsQuery);
            const vendorData = data?.organization?.accounts;

            if (vendorData?.nodes) {
                allVendors = allVendors.concat(vendorData.nodes);
            } else if (nextPage === null) {
                 console.warn("No vendors found or failed to fetch initial vendors list.");
            }

            nextPage = vendorData?.nextPage;
            hasMore = !!nextPage;
        }

        setVendors(allVendors);
        if (allVendors.length === 0 && error === null) {
            console.warn("Finished fetching vendors: No vendors found.");
        }

    } catch (err) {
      console.error("Fetching vendors failed:", err);
      setError("Could not load vendors. Please try again later.");
      setVendors([]); // Clear vendors on error
       // Avoid message.error here as fetchJobTread likely shows one
    } finally {
      setLoadingVendors(false);
    }
  }, []);

  // Fetch data based on targetType
  useEffect(() => {
    if (targetType === 'job') {
      fetchJobsList();
    } else {
      fetchVendorsList();
    }
    // Reset selection when type changes
    form.resetFields(['targetId']);
  }, [targetType, fetchJobsList, fetchVendorsList, form]);

  const handleTargetTypeChange = (e) => {
    setTargetType(e.target.value);
  };

  // Handle form submission
  const onFinish = async (values) => {
    console.log('Received values of form:', values);
    setSubmitting(true);
    setError(null);

    const { targetId, folders } = values;
    const folderNames = folders
        .map(f => f?.name) // Safely access name
        .filter(name => name && name.trim() !== ''); // Filter out empty/null names

    if (!targetId) {
        message.error(`Please select a ${targetType}.`);
        setSubmitting(false);
        return;
    }

    if (folderNames.length === 0) {
        message.error('Please add at least one valid folder name.');
        setSubmitting(false);
        return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        message.error('Authentication token not found. Please log in again.');
        // Redirect to login
        router.push('/login');
        setSubmitting(false);
        return;
    }

    const requestBody = {
        folders: folderNames,
    };
    if (targetType === 'job') {
        requestBody.job_id = targetId;
    } else {
        requestBody.vendor_id = targetId;
    }

    try {
        const response = await fetch(`${BASE_URL}/jobtread/add-folders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${authToken}`, // Add the auth token here
            },
            body: JSON.stringify(requestBody),
        });

        // Handle Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            message.error("Session expired. Please log in again.");
            router.push('/login');
            throw new Error("Unauthorized"); // Throw error to stop execution
        }

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || `Server responded with status ${response.status}`);
        }

        message.success(`Folders added successfully to ${targetType}!`)
        form.resetFields(['folders']); // Optionally reset folder fields
        // Consider resetting targetId as well if desired: form.resetFields(['targetId', 'folders']);

    } catch (err) {
        // Avoid logging "Unauthorized" as a user-facing error if handled above
        if (err.message !== "Unauthorized") {
            console.error(`Failed to add folders to ${targetType}:`, err);
            setError(`Failed to add folders: ${err.message}`);
            message.error(`Failed to add folders: ${err.message}`);
        }
    } finally {
        setSubmitting(false);
    }
  };

  const isLoading = targetType === 'job' ? loadingJobs : loadingVendors;
  const options = (targetType === 'job' ? jobs : vendors).map(item => ({ value: item.id, label: item.name }));

  return (
    <Container>
      <Title>Create Folders</Title>
      {error && <Alert message={error} type="error" showIcon style={{ marginBottom: '1rem' }} />}
      <Form
        form={form}
        name="folder_creator"
        onFinish={onFinish}
        autoComplete="off"
        layout="vertical"
      >
        <Form.Item label="Select Target Type" name="targetType">
           <Radio.Group onChange={handleTargetTypeChange} value={targetType}>
              <Radio.Button value="job">Job</Radio.Button>
              <Radio.Button value="vendor">Vendor</Radio.Button>
            </Radio.Group>
        </Form.Item>

        <Form.Item
          name="targetId" // Changed from jobId
          label={`Select ${targetType === 'job' ? 'Job' : 'Vendor'}`}
          rules={[{ required: true, message: `Please select a ${targetType}!` }]}
        >
          <Select
            showSearch
            placeholder={`Select a ${targetType}`}
            loading={isLoading}
            optionFilterProp="children"
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={options}
            disabled={isLoading} // Disable while loading options
          />
        </Form.Item>

        <Form.List
          name="folders"
          initialValue={[{ name: '' }]} // Start with one empty folder field
        >
          {(fields, { add, remove }) => (
            <>
            <label style={{ display: 'block', marginBottom: '8px', color: 'rgba(0, 0, 0, 0.88)', fontSize: '14px' }}>Folder Names</label>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'Missing folder name' }]}
                    style={{ flexGrow: 1 }}
                    // No label needed here for individual items
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
            {`Create Folders for ${targetType === 'job' ? 'Job' : 'Vendor'}`}
          </Button>
        </Form.Item>
      </Form>
    </Container>
  );
};

export default FolderCreator; 