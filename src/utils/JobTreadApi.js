import { toast } from 'react-toastify';

const PROXY_ENDPOINT = "https://be.humanagement.io/actions/api/jobtread-proxy/";
const GRANT_KEY = "22SkCV5JXCtY6eKk5w2ZWBsyhpBBrr6Lea";
const ORGANIZATION_ID = "22NwWhUAf6VB";

// Private shared function to handle JobTread API calls
const _callJobTreadApi = async (customQuery, options = {}) => {
  const { 
    method = "POST", 
    data = undefined, 
    errorPrefix = "communicating with",
    showSuccessMessage = false,
    successMessage = "Operation completed successfully" 
  } = options;
  
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
  
  // Add data if provided
  if (data) {
    baseQuery.data = data;
  }

  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(baseQuery)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      const errorMessage = responseData.message || responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (responseData.error) {
      throw new Error(responseData.error);
    }
    
    if (showSuccessMessage) {
      console.log("Success message:");
      toast.success(successMessage);
    }
    
    return responseData;
  } catch (error) {
    console.error(`JobTread API Error (${method}):`, error);
    // Get the most detailed error message available
    const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
    toast.error(`Problem ${errorPrefix} JobTread: ${errorMessage}`);
    throw error;
  }
};

export const fetchJobTread = async (customQuery) => {
  return _callJobTreadApi(customQuery);
};

export const updateJobTread = async (customQuery, updateData, method = "POST") => {
  return _callJobTreadApi(customQuery, {
    method: method,
    data: updateData,
    errorPrefix: "updating data in",
    showSuccessMessage: true,
    successMessage: "Data updated successfully in JobTread"
  });
};
