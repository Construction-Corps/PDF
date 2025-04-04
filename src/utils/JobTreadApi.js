import { toast } from 'react-toastify';

const PROXY_ENDPOINT = "https://ccbe.onrender.com/jobtread-proxy/";
const GRANT_KEY = "22SkCV5JXCtY6eKk5w2ZWBsyhpBBrr6Lea";
const ORGANIZATION_ID = "22NwWhUAf6VB";

// Generate a 5-letter key from custom query to identify API calls
const generateQueryKey = (customQuery) => {
  // Convert query to string and generate a simple hash
  const queryString = JSON.stringify(customQuery);
  let hash = 0;
  for (let i = 0; i < queryString.length; i++) {
    const char = queryString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert hash to a 5-letter key (using letters A-Z)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let key = '';
  const positiveHash = Math.abs(hash);
  for (let i = 0; i < 5; i++) {
    key += letters[Math.floor((positiveHash / Math.pow(26, i)) % 26)];
  }
  
  return key;
};

// Private shared function to handle JobTread API calls
const _callJobTreadApi = async (customQuery, options = {}) => {
  const { 
    method = "POST", 
    data = undefined, 
    errorPrefix = "communicating with",
    showSuccessMessage = false,
    successMessage = "Operation completed successfully" 
  } = options;
  
  // Get auth token
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
  
  // Generate 5-letter key for the query
  const queryKey = generateQueryKey(customQuery);
  
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
    // Append the query key to the URL
    const url = `${PROXY_ENDPOINT}?${queryKey}`;
    
    const headers = { 
      "Content-Type": "application/json" 
    };
    
    // Add auth token if available
    if (authToken) {
      headers["Authorization"] = `Token ${authToken}`;
    }
    
    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: JSON.stringify(baseQuery)
    });
    
    // Handle unauthorized response
    if (response.status === 401) {
      // Clear token and redirect to login
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      
      // Use window.location for client-side navigation in utility functions
      if (typeof window !== 'undefined') {
        toast.error("Your session has expired. Please log in again.");
        window.location.href = '/login';
      }
      throw new Error("Unauthorized - Please log in");
    }
    
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
