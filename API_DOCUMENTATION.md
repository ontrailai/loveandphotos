# Love & Photos API Documentation

## Overview
The Love & Photos API provides endpoints for photography booking, payment processing, and communication services. Built with Express.js and designed for reliability and scalability.

## Base URL
- **Development**: `http://localhost:3001`
- **Production**: `https://lovep-marketplace.onrender.com`

## Authentication
Currently, the API operates in development mode with mock services. Authentication will be implemented in production using Supabase Auth.

## Endpoints

### Health Check

#### GET `/api/health`
Returns the current status of the API and its dependencies.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-09-13T19:30:00.000Z",
  "environment": "development",
  "configured": {
    "stripe": false,
    "supabase": true,
    "resend": false
  },
  "services": {
    "stripe": "mock mode",
    "supabase": "configured",
    "email": "mock mode"
  }
}
```

**Status Codes:**
- `200`: API is healthy
- `500`: API is experiencing issues

---

### Payment Processing

#### POST `/api/create-checkout-session`
Creates a Stripe checkout session for photography service booking.

**Request Body:**
```json
{
  "customerEmail": "customer@example.com",
  "amount": 1299,
  "eventDate": "2024-06-15",
  "photographerId": "photographer-123",
  "packageId": "package-456",
  "successUrl": "https://yoursite.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "https://yoursite.com/cancel"
}
```

**Required Fields:**
- `customerEmail`: Valid email address
- `amount`: Amount in dollars (minimum $1, maximum $50,000)

**Optional Fields:**
- `eventDate`: Date of the photography event
- `photographerId`: ID of the selected photographer
- `packageId`: ID of the selected package
- `successUrl`: Redirect URL after successful payment
- `cancelUrl`: Redirect URL after cancelled payment

**Response:**
```json
{
  "id": "cs_test_mock_1694627400123",
  "url": "https://checkout.stripe.com/c/pay/cs_test_mock_1694627400123"
}
```

**Status Codes:**
- `200`: Checkout session created successfully
- `400`: Invalid request data
- `500`: Server error during session creation

#### GET `/api/verify-payment`
Verifies the status of a Stripe checkout session.

**Query Parameters:**
- `session_id` (required): The checkout session ID to verify

**Response:**
```json
{
  "success": true,
  "session": {
    "id": "cs_test_mock_1694627400123",
    "payment_status": "paid",
    "metadata": {
      "photographerId": "photographer-123",
      "packageId": "package-456",
      "eventDate": "2024-06-15"
    }
  }
}
```

**Status Codes:**
- `200`: Session verified successfully
- `400`: Missing or invalid session ID
- `500`: Server error during verification

---

### Email Services

#### POST `/api/send-email`
Sends email notifications and communications.

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Your Photography Booking Confirmation",
  "html": "<p>Thank you for your booking!</p>",
  "text": "Thank you for your booking!",
  "template": "booking_confirmation",
  "templateData": {
    "customerName": "John Doe",
    "eventDate": "2024-06-15",
    "photographerName": "Jane Smith"
  }
}
```

**Required Fields:**
- `to`: Recipient email address (string or array of strings)
- `subject` OR `template`: Email subject or template name

**Optional Fields:**
- `html`: HTML email content
- `text`: Plain text email content
- `template`: Template name for pre-defined emails
- `templateData`: Data for template rendering

**Available Templates:**
- `booking_confirmation`: Customer booking confirmation
- `photographer_notification`: New booking notification for photographers
- `payment_receipt`: Payment confirmation receipt
- `welcome`: Welcome email for new users

**Response:**
```json
{
  "success": true,
  "id": "email_mock_1694627400123_abc123",
  "messageId": "mock_1694627400123"
}
```

**Status Codes:**
- `200`: Email sent successfully
- `400`: Invalid email data
- `500`: Email delivery failure

---

### File Upload

#### POST `/api/upload`
Handles file uploads for portfolio images and documents.

**Request Body:**
```json
{
  "filename": "portfolio-image.jpg",
  "contentType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "url": "https://storage.example.com/portfolio-image.jpg",
  "path": "uploads/portfolio-image.jpg",
  "contentType": "image/jpeg"
}
```

**Status Codes:**
- `200`: File uploaded successfully
- `400`: Invalid file data
- `500`: Upload failure

---

### Stripe Connect

#### POST `/api/create-connect-onboarding`
Creates Stripe Connect onboarding link for photographers.

**Request Body:**
```json
{
  "accountId": "acct_photographer_123",
  "refreshUrl": "https://yoursite.com/onboarding?refresh=true",
  "returnUrl": "https://yoursite.com/onboarding?complete=true"
}
```

**Response:**
```json
{
  "url": "https://connect.stripe.com/setup/e/onboarding_link_123"
}
```

**Status Codes:**
- `200`: Onboarding link created successfully
- `400`: Invalid account data
- `500`: Link creation failure

---

### Webhooks

#### POST `/api/webhooks/stripe`
Handles Stripe webhook events for payment processing.

**Headers:**
- `stripe-signature`: Stripe webhook signature for verification

**Request Body:** Raw webhook payload from Stripe

**Response:**
```json
{
  "received": true
}
```

**Handled Events:**
- `checkout.session.completed`: Payment successful
- `account.updated`: Connect account status changes
- `payment_intent.succeeded`: Payment confirmation

**Status Codes:**
- `200`: Webhook processed successfully
- `400`: Invalid webhook signature or payload

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong",
  "message": "Detailed error information",
  "timestamp": "2024-09-13T19:30:00.000Z"
}
```

### Common Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Authentication required
- `404`: Not Found - Endpoint or resource not found
- `500`: Internal Server Error - Server-side error
- `503`: Service Unavailable - External service unavailable

### Validation Errors
The API validates all input data and returns specific error messages:

```json
{
  "error": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "amount": "Amount must be between $1 and $50,000",
    "eventDate": "Date must be in the future"
  }
}
```

## Rate Limiting
- **Development**: No rate limiting
- **Production**: 100 requests per minute per IP address

## Testing
The API includes comprehensive test coverage:
- **Unit Tests**: Individual function validation
- **Integration Tests**: End-to-end workflow testing
- **Load Tests**: Performance and reliability testing

Run tests with:
```bash
npm test                    # All tests
npm run test:api           # API endpoint tests only
npm run test:coverage      # Coverage report
```

## Monitoring
Health check endpoint (`/api/health`) provides real-time status information suitable for:
- Kubernetes liveness/readiness probes
- Load balancer health checks
- Monitoring systems (Datadog, New Relic, etc.)

## Security
- Input validation on all endpoints
- XSS protection through content sanitization
- CORS configuration for allowed origins
- Webhook signature verification
- No sensitive data in error messages

## Support
For API support or questions:
- Check the test suite for usage examples
- Review error messages for specific guidance
- Monitor the health endpoint for system status

## Changelog
- **v1.0.0**: Initial API implementation with payment and email services
- **v1.0.1**: Added file upload and Stripe Connect support
- **v1.0.2**: Enhanced error handling and validation