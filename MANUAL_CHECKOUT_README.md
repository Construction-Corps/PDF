# Manual Inventory Checkout Feature

## Overview

The manual checkout feature allows users to check out inventory items without scanning QR codes. This is useful for bulk checkouts, when QR codes are not available, or for administrative purposes.

## Features

- **Multiple Item Selection**: Select multiple items in one checkout session
- **Quantity Support**: Specify quantities for each item (defaults to 1)
- **User Selection**: Choose which user is performing the checkout
- **Location Tracking**: Add location name and optional GPS coordinates
- **Action Types**: Support for CHECK_OUT, CHECK_IN, and AUDIT actions
- **Real-time Validation**: Prevents selecting items with zero availability
- **Error Handling**: Shows partial success with error details for failed items

## How to Use

### From Inventory Items Page

1. Navigate to `/inventory/items`
2. Select one or more items using the checkboxes
3. Click the "Manual Checkout" button in the action bar
4. Fill in the required information:
   - **User**: Select the user performing the checkout
   - **Action**: Choose Check Out, Check In, or Audit
   - **Location Name**: Enter a descriptive location name
   - **GPS Coordinates**: Optional - use "Get Location" button for current location
5. Adjust quantities for selected items if needed
6. Click "Checkout Items" to complete the process

### From Individual Item Actions

1. Navigate to `/inventory/items`
2. Click the shopping cart icon in the action column for any item
3. The item will be pre-selected in the checkout modal
4. Complete the checkout process as above

### From Scan Logs Page

1. Navigate to `/inventory/scan-logs`
2. Click the "Manual Checkout" button in the action bar
3. Select items and complete the checkout process

### Standalone Manual Checkout Page

1. Navigate to `/inventory/manual-checkout`
2. Click "Start Checkout" or "Manual Checkout"
3. Select items and complete the checkout process

## API Endpoint

The feature uses the following API endpoint:

```
POST /api/inventory/actions/manual-checkout/
```

### Request Format:
```json
{
    "items": [
        {"item_id": 1, "quantity": 2},
        {"item_id": 5, "quantity": 1}
    ],
    "user_id": 1,
    "location_name": "Job Site Address",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "action": "CHECK_OUT"
}
```

### Response Format:
```json
{
    "created_logs": [...],
    "total_processed": 3,
    "errors": ["Item with ID 10 not found"]
}
```

## User Interface Features

### Item Selection
- Items are displayed with name, description, storage location, and availability
- Items with zero quantity are visually dimmed and cannot be selected
- Available quantities are color-coded (green for available, red for out of stock)

### Location Features
- Manual location name entry (required)
- Optional GPS coordinates
- "Get Location" button to automatically capture current GPS coordinates
- Geolocation support for mobile devices

### Validation
- Prevents checkout with zero selected items
- Validates quantities against available stock
- Shows real-time summary of selected items and total quantities
- Displays error messages for failed operations

## Integration

The manual checkout feature integrates seamlessly with the existing inventory system:

- Creates `ScanLog` entries just like QR code scanning
- Updates item quantities automatically
- Appears in scan logs with the same format as scanned items
- Supports all existing inventory tracking features

## Error Handling

- **Partial Success**: If some items fail, the operation continues and reports errors
- **Validation Errors**: Clear error messages for invalid inputs
- **Network Errors**: Graceful handling of API communication issues
- **User Feedback**: Success and warning messages for all operations

## Security

- Requires authentication (protected routes)
- Validates user permissions
- Sanitizes all inputs
- Logs all checkout activities for audit purposes

## Browser Compatibility

- Works on all modern browsers
- Geolocation support for GPS coordinates
- Responsive design for mobile devices
- Progressive enhancement for older browsers 