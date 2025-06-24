import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = () => {
  if (typeof window === 'undefined') {
    return null; // Return null on the server side
  }

  let deviceId = localStorage.getItem('construction-corps-device-id');
  
  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem('construction-corps-device-id', deviceId);
  }
  
  return deviceId;
}; 