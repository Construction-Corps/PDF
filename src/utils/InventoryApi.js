import { toast } from 'react-toastify';

const API_BASE_URL = "https://ccbe.onrender.com/api/inventory";
const API_ROOT = "https://ccbe.onrender.com/api";

// Private shared function to handle Inventory API calls
const _callInventoryApi = async (endpoint, options = {}) => {
  const { 
    method = "GET", 
    data = undefined, 
    errorPrefix = "communicating with",
    showSuccessMessage = false,
    successMessage = "Operation completed successfully" 
  } = options;

  // Get auth token
  const authToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = { 
    "Content-Type": "application/json" 
  };
  
  // Add auth token if available
  if (authToken) {
    headers["Authorization"] = `Token ${authToken}`;
  }
  
  const fetchOptions = {
    method: method,
    headers: headers,
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    // Handle unauthorized response
    if (response.status === 401) {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
      
      if (typeof window !== 'undefined') {
        toast.error("Your session has expired. Please log in again.");
        window.location.href = '/login';
      }
      throw new Error("Unauthorized - Please log in");
    }
    
    // Handle cases where response might not have a body
    const responseData = await response.text();
    const jsonResponse = responseData ? JSON.parse(responseData) : {};

    if (!response.ok) {
      const errorMessage = jsonResponse.message || jsonResponse.detail || jsonResponse.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (jsonResponse.error) {
      throw new Error(jsonResponse.error);
    }
    
    if (showSuccessMessage) {
      toast.success(successMessage);
    }
    
    return jsonResponse;
  } catch (error) {
    console.error(`Inventory API Error (${method} ${endpoint}):`, error);
    const errorMessage = error.message;
    toast.error(`Problem ${errorPrefix} inventory system: ${errorMessage}`);
    throw error;
  }
};

// Helper to get CSRF token from cookies
const getCsrfToken = () => {
  if (typeof document === 'undefined') return '';
  const token = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
  return token ? token.split('=')[1] : '';
};

const _callPublicApi = async (endpoint, options = {}) => {
  const { 
    method = "GET", 
    data = undefined, 
    errorPrefix = "communicating with",
    showSuccessMessage = false,
    successMessage = "Operation completed successfully" 
  } = options;

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers = { 
    "Content-Type": "application/json"
  };

  if (method === 'POST') {
    headers['X-CSRFToken'] = getCsrfToken();
  }
  
  const fetchOptions = {
    method: method,
    headers: headers,
    // Include credentials to send cookies (like csrftoken) with the request
    credentials: 'include' 
  };

  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, fetchOptions);
    
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = responseData.message || responseData.detail || responseData.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }
    
    if (showSuccessMessage) {
      toast.success(successMessage);
    }
    
    return responseData;
  } catch (error) {
    console.error(`Public API Error (${method} ${endpoint}):`, error);
    const errorMessage = error.message;
    toast.error(`Problem ${errorPrefix} inventory system: ${errorMessage}`);
    throw error;
  }
};

// --- Custom Action Endpoints ---

export const registerDevice = async (token, device_id, name) => {
  return _callInventoryApi('/actions/register-device/', {
    method: "POST",
    data: { token, device_id, name },
    errorPrefix: "registering device in",
    showSuccessMessage: true,
    successMessage: "Device registered successfully!"
  });
};

export const scanItem = async (qr_code_id, device_id, action, latitude = null, longitude = null) => {
  const data = { qr_code_id, device_id, action };
  if (latitude !== null && longitude !== null) {
    data.latitude = latitude;
    data.longitude = longitude;
  }
  return _callInventoryApi('/actions/scan/', {
    method: "POST",
    data,
    errorPrefix: "scanning item in",
    showSuccessMessage: true,
    successMessage: `Item successfully recorded as ${action.replace('_', ' ').toLowerCase()}`
  });
};

// --- Standard Resource Endpoints ---

// Generic fetch function
export const fetchInventory = async (resource, id = '') => {
  const endpoint = id ? `/${resource}/${id}/` : `/${resource}/`;
  return _callInventoryApi(endpoint, {
    errorPrefix: `fetching ${resource}`
  });
};

// Fetch category tree structure
export const fetchCategoryTree = async () => {
  return _callInventoryApi('/categories/tree/', {
    errorPrefix: 'fetching category tree'
  });
};

// Generic create function
export const createInventory = async (resource, data) => {
  return _callInventoryApi(`/${resource}/`, {
    method: 'POST',
    data: data,
    errorPrefix: `creating ${resource}`,
    showSuccessMessage: true,
    successMessage: `${resource.slice(0, -1)} created successfully`
  });
};

// Generic update function
export const updateInventory = async (resource, id, data) => {
  return _callInventoryApi(`/${resource}/${id}/`, {
    method: 'PATCH', // Using PATCH for partial updates
    data: data,
    errorPrefix: `updating ${resource}`,
    showSuccessMessage: true,
    successMessage: `${resource.slice(0, -1)} updated successfully`
  });
};

// Generic delete function
export const deleteInventory = async (resource, id) => {
  return _callInventoryApi(`/${resource}/${id}/`, {
    method: 'DELETE',
    errorPrefix: `deleting ${resource}`,
    showSuccessMessage: true,
    successMessage: `${resource.slice(0, -1)} deleted successfully`
  });
};

// ---- Auth Users ----
export const fetchUsers = async () => {
  const endpoint = `${API_ROOT}/auth/users/`;
  return _callInventoryApi(endpoint);
};

// --- New Public Action Endpoints ---

export const quickRegisterDevice = async (user_id, device_id, name) => {
  return _callPublicApi('/actions/quick-register/', {
    method: "POST",
    data: { user_id, device_id, name },
    errorPrefix: "in quick registration",
    showSuccessMessage: true,
    successMessage: "Device registered successfully!"
  });
};

export const registerDeviceWithToken = async (token, device_id, name) => {
  return _callPublicApi('/actions/register-device/', {
    method: "POST",
    data: { token, device_id, name },
    errorPrefix: "registering device with token",
    showSuccessMessage: true,
    successMessage: "Device registered successfully!"
  });
};

export const publicScanItem = async (qr_code_id, device_id, action, latitude, longitude) => {
  const data = { qr_code_id, device_id, action };
  if (latitude !== null && longitude !== null) {
    data.latitude = latitude;
    data.longitude = longitude;
  }
  return _callPublicApi('/actions/scan/', {
    method: "POST",
    data,
    errorPrefix: "scanning item publicly",
    showSuccessMessage: true,
    successMessage: `Item successfully recorded as ${action.replace('_', ' ').toLowerCase()}`
  });
};

export const fetchPublicUsers = async () => {
  const endpoint = `${API_ROOT}/auth/users/short-list/`;
  return _callPublicApi(endpoint);
};

export const updateScanAction = async (scanLogId, newAction) => {
  return _callPublicApi(`/scan-logs/${scanLogId}/update-action/`, {
    method: "PATCH",
    data: { action: newAction },
    errorPrefix: "updating scan action",
    showSuccessMessage: true,
    successMessage: "Scan action updated successfully!"
  });
};

// Generate QR code for an item
export const generateQRCode = async (itemId) => {
  return _callInventoryApi(`/items/${itemId}/generate_qr_code/`, {
    method: 'POST',
    errorPrefix: 'generating QR code',
    showSuccessMessage: true,
    successMessage: 'QR code generated and assigned successfully!'
  });
}; 