import { toast } from 'react-toastify';

const PROXY_ENDPOINT = "https://be.humanagement.io/actions/api/jobtread-proxy/";
const GRANT_KEY = "22SkCV5JXCtY6eKk5w2ZWBsyhpBBrr6Lea";
const ORGANIZATION_ID = "22NwWhUAf6VB";

export const fetchJobTread = async (customQuery) => {
  // If the query includes organization, inject the ID into it
  const processedQuery = {
    ...customQuery,
    organization: customQuery.organization ? {
      "$": { "id": ORGANIZATION_ID },
      "id": {},
      ...customQuery.organization
    } : undefined
  };

  const baseQuery = {
    query: {
      "$": { "grantKey": GRANT_KEY },
      ...processedQuery
    }
  };

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseQuery)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return data;
  } catch (error) {
    console.error("JobTread API Error:", error);
    // Get the most detailed error message available
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    toast.error(`Problem communicating with JobTread: ${errorMessage}`);
    throw error;
  }
};
