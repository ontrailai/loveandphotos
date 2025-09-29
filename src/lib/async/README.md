# Contract Signing System - Backend Architecture

## Overview

This backend system provides bulletproof contract signing functionality with comprehensive timeout/retry logic, security validation, and audit trails. Built with fault tolerance and data integrity as primary concerns.

## Architecture Components

### 1. Timeout/Retry Utilities (`withTimeout.js`)

Core utilities for reliable async operations:

- **`withTimeout(promise, ms)`** - Race promise against timeout
- **`withRetry(fn, tries)`** - Retry with exponential backoff
- **`normalizeError(error)`** - Standardize error messages
- **`withTimeoutAndRetry(fn, options)`** - Combined reliability
- **`checkRateLimit(key, max, window)`** - In-memory rate limiting
- **`auditLog(event, data, ip)`** - Security audit logging

### 2. Contract Service (`contractService.js`)

Database operations with Supabase integration:

- **`verifyBookingOwnership(bookingId, userId)`** - RLS validation
- **`verifyContractHash(hash, version, data)`** - Contract integrity
- **`storeContractSignature(data, ip)`** - Atomic storage with audit
- **`getContractSignature(id)`** - Retrieve signature records
- **`contractServiceHealthCheck()`** - Service monitoring

### 3. API Endpoints

#### `POST /api/contract/sign`

**Purpose**: Sign a contract with full validation and audit trail

**Rate Limiting**: 5 requests per minute per IP

**Payload Limit**: 2MB (enforced by Express middleware)

**Request Body**:
```json
{
  "bookingId": "string (required)",
  "contractVersion": "string (required)",
  "contractHash": "string (required)",
  "signaturePngBase64": "data:image/png;base64,... (required)",
  "eventDate": "string (optional)",
  "location": "string (optional)",
  "packageName": "string (optional)",
  "price": "number (optional)",
  "signerFullName": "string (optional)",
  "signedAtISO": "string (optional)",
  "userId": "string (should come from JWT in production)"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "contractSignatureId": "cs_1234567890_abcdef123",
  "message": "Contract signature recorded successfully",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "processingTime": 1234,
  "metadata": {
    "contractVersion": "1.0",
    "bookingId": "booking_123",
    "signedAt": "2024-01-15T10:30:00.000Z",
    "eventDate": "2024-06-15",
    "location": "Wedding Venue"
  }
}
```

**Error Responses**:
- **400**: Missing fields, invalid format, signature too large
- **403**: Booking access denied (RLS failure)
- **409**: Contract already signed
- **429**: Rate limit exceeded
- **500**: Internal server error

#### `GET /api/contract/status/:signatureId`

**Purpose**: Retrieve contract signature details

**Success Response** (200):
```json
{
  "success": true,
  "signature": {
    "id": "cs_1234567890_abcdef123",
    "booking_id": "booking_123",
    "contract_version": "1.0",
    "event_date": "2024-06-15",
    "location": "Wedding Venue",
    "package_name": "Premium Package",
    "price": 299.99,
    "signer_full_name": "John Doe",
    "signed_at": "2024-01-15T10:30:00.000Z",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Contract signature found"
}
```

## Security Features

### 1. Row Level Security (RLS)
- Booking ownership verified via Supabase RLS
- Users can only sign contracts for their own bookings
- Prevents unauthorized contract manipulation

### 2. Contract Hash Verification
- Server-side hash validation prevents tampered contracts
- Hash generated from booking data ensures integrity
- Prevents signing of outdated contract versions

### 3. Rate Limiting
- 5 requests per minute per IP address
- Prevents abuse and automated attacks
- Configurable window and limits

### 4. Input Validation
- Required field validation
- Signature format validation (PNG base64 only)
- Size limits (2MB maximum)
- SQL injection prevention via parameterized queries

### 5. Audit Logging
- Complete audit trail for all operations
- IP address tracking
- Success/failure logging
- Security event monitoring

## Error Handling Strategy

### 1. Timeout Protection
- 10-second default timeout for database operations
- 8-second timeout for booking verification
- 12-second timeout for signature storage (longer due to transaction)

### 2. Retry Logic
- 2 retries by default with exponential backoff
- No retries for client errors (4xx status codes)
- Different retry strategies for different operations

### 3. Error Classification
- **Client Errors**: 400-499 (don't retry)
- **Server Errors**: 500-599 (retry appropriate)
- **Network Errors**: 503 (retry with backoff)
- **Database Errors**: Normalized with context

### 4. Graceful Degradation
- Mock mode when Supabase not configured
- Fallback responses for development
- Health check endpoint monitoring

## Database Schema

### `contract_signatures` Table
```sql
CREATE TABLE contract_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  contract_version VARCHAR NOT NULL,
  contract_hash VARCHAR NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  package_name VARCHAR NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  signer_full_name VARCHAR,
  signature_png_base64 TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_contract_signatures_booking_id ON contract_signatures(booking_id);
CREATE INDEX idx_contract_signatures_created_at ON contract_signatures(created_at);

-- RLS Policies
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contract signatures" ON contract_signatures
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings WHERE customer_id = auth.uid()
    )
  );
```

## Performance Considerations

### 1. Connection Pooling
- Supabase handles connection pooling automatically
- Service role key for server operations
- Separate user context for RLS validation

### 2. Query Optimization
- Indexed foreign keys for fast lookups
- Single query for booking verification with joins
- Minimal data transfer with selective queries

### 3. Caching Strategy
- Rate limit data cached in memory (Redis recommended for production)
- Contract hash validation cached per version
- Health check results cached briefly

## Monitoring and Observability

### 1. Health Checks
- `/api/health` endpoint includes contract service status
- Database connectivity monitoring
- Service dependency validation

### 2. Audit Logging
- All contract operations logged with context
- Security events tracked with IP addresses
- Processing time metrics for performance monitoring

### 3. Error Tracking
- Normalized error messages with codes
- Stack traces in development mode
- Error context preservation for debugging

## Production Deployment

### 1. Environment Variables
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
NODE_ENV=production
```

### 2. Security Considerations
- JWT authentication middleware required
- HTTPS enforcement
- Rate limiting with Redis backend
- Security headers middleware

### 3. Monitoring Setup
- Application monitoring (e.g., DataDog, New Relic)
- Database monitoring via Supabase dashboard
- Log aggregation for audit trails
- Alert on contract signing failures

## Testing

Comprehensive test suite covering:
- Timeout/retry utility functions
- Error normalization edge cases
- Rate limiting behavior
- API endpoint integration
- Mock mode validation
- Security validation

Run tests with:
```bash
npm test tests/api/contract-signing.test.js
```

## Usage Examples

### Frontend Integration
```javascript
import { ContractSigningService } from './contractSigningService'

// Sign contract
const result = await ContractSigningService.signContract({
  bookingId: 'booking_123',
  contractVersion: '1.0',
  contractHash: 'hash_from_frontend',
  signaturePngBase64: canvasSignature.toDataURL(),
  signerFullName: 'John Doe'
})

// Check status
const status = await ContractSigningService.getSignatureStatus(result.contractSignatureId)
```

### Server-Side Usage
```javascript
import { verifyBookingOwnership, storeContractSignature } from './contractService'

// Verify ownership with timeout/retry
const booking = await verifyBookingOwnership(bookingId, userId)

// Store with full audit trail
const signatureId = await storeContractSignature(signatureData, clientIp)
```

This architecture provides enterprise-grade reliability, security, and auditability for contract signing operations while maintaining clear separation of concerns and comprehensive error handling.