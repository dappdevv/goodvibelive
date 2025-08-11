# GoodVibe Live 8-Level Referral System Documentation

## Overview
The 8-level referral system automatically distributes commissions across up to 8 levels of referrals with the following rates:
- **Level 1**: 30% commission
- **Level 2**: 20% commission  
- **Level 3**: 15% commission
- **Level 4**: 10% commission
- **Level 5**: 8% commission
- **Level 6**: 6% commission
- **Level 7**: 4% commission
- **Level 8**: 2% commission

## Database Architecture

### Core Tables
- `profiles`: User profiles with referral tracking
- `referrals`: Direct referral relationships (1-8 levels)
- `referral_relationships`: Recursive relationship tracking
- `user_referral_slots`: Slot-based referral management for level 1 (max 6 slots)
- `referral_earnings`: Commission tracking across all levels
- `commission_rates`: Defined rates for each level

### Token System
- `token_balances`: User token balances (TAC currency)
- `token_transactions`: Complete transaction history
- `gifts`: Phone number-based gift token redemption system

## API Endpoints

### Edge Functions

#### 1. Referral System API (`referral-system-api`)
Base URL: `https://kztxahgyfxrwpcffafyu.supabase.co/functions/v1/referral-system-api`

**Track Referral Placement**
```http
POST /track-referral
Content-Type: application/json
{
  "user_id": "uuid",
  "referral_code": "REF123456"
}
```

**Create Gift Tokens**
```http
POST /create-gift
Content-Type: application/json
{
  "sender_id": "uuid",
  "recipient_phone": "+1234567890",
  "token_amount": 100,
  "message": "Welcome to GoodVibe!"
}
```

**Redeem Gift Tokens**
```http
POST /redeem-gift
Content-Type: application/json
{
  "recipient_phone": "+1234567890",
  "user_id": "uuid",
  "referral_code": "REF123456" // optional
}
```

**Get User Referral Stats**
```http
POST /get-referral-stats
Content-Type: application/json
{
  "user_id": "uuid"
}
```

**Get Token Balance**
```http
POST /get-balance
Content-Type: application/json
{
  "user_id": "uuid"
}
```

#### 2. Admin Analytics API (`referral-admin-analytics`)
Base URL: `https://kztxahgyfxrwpcffafyu.supabase.co/functions/v1/referral-admin-analytics`

Requires JWT authentication via Authorization header

**Referral Overview**
```http
GET /admin/referral-overview?start_date=2025-01-01&end_date=2025-12-31
Authorization: Bearer jwt_token
```

**Top Referrers**
```http
GET /admin/top-referrers?limit=20&start_date=2025-01-01
Authorization: Bearer jwt_token
```

**Commission Summary**
```http
GET /admin/commission-summary?start_date=2025-01-01&end_date=2025-12-31
Authorization: Bearer jwt_token
```

**User Analytics**
```http
GET /admin/user-analytics?user_id=uuid
Authorization: Bearer jwt_token
```

**Gift Analytics**
```http
GET /admin/gift-analytics?start_date=2025-01-01&end_date=2025-12-31
Authorization: Bearer jwt_token
```

**System Health**
```http
GET /system-health
Authorization: Bearer jwt_token
```

## Database Functions

### Referral Placement
```sql
SELECT * FROM find_optimal_referrer('REF123456')
```

### Process Referral
```sql
SELECT * FROM process_referral_placement('uuid', 'REF123456')
```

### Token Management
```sql
-- Get balance
SELECT get_user_balance('uuid')

-- Credit tokens
SELECT * FROM credit_user_balance('uuid', 100.0, 'Bonus tokens', 'reward')

-- Debit tokens  
SELECT * FROM debit_user_balance('uuid', 50.0, 'Service usage', 'usage')
```

### Gift Management
```sql
-- Create gift
SELECT * FROM create_gift_token('sender_uuid', '+1234567890', 100.0, 'Welcome message')

-- Redeem gift
SELECT * FROM redeem_gift_token('+1234567890', 'user_uuid', 'REF123456')

-- Get active gifts
SELECT * FROM get_active_gifts_by_phone('+1234567890')
```

### Analytics
```sql
-- Get user's referral statistics
SELECT * FROM get_referral_statistics('user_uuid')
```

## Automatic Commission Distribution

### Trigger Points
1. **AI Generation Usage**: Automatically distributes commissions across all 8 levels
2. **Gift Redemption**: Links phone-based gifts to referral network
3. **New User Registration**: Generates unique referral codes and processes placement

### Job Scheduling
- Commission calculations happen in real-time
- Gift redemptions trigger referral placement
- Slot management ensures correct placement in 8-level tree

## Phone Number Integration

### Gift Token Process
1. User sends gift tokens via phone number
2. Recipient receives unique promo code via SMS/track
3. Recipient joins platform and redeems gift
4. System automatically links recipient to sender's referral network
5. Commission flow starts from this point

### Phone Number Formats
- International format: +1234567890
- Domestic format: 1234567890
- Both formats are standardized before processing

## Security Features

### Rate Limiting
- Gift creation: 5 gifts per hour per user
- API endpoints: 100 requests per minute
- Phone verification: 3 attempts per phone number per day

### Validation
- Phone number format validation
- Token balance verification
- Unique referral code generation
- Slot availability checking

### JWT Security
- All admin endpoints require valid JWT
- User-specific endpoints validate user ownership
- Rate limiting per user ID

## Environment Variables

Required for Edge Functions:
```bash
SUPABASE_URL=https://kztxahgyfxrwpcffafyu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Detailed error message",
  "code": "ERROR_CODE"
}
```

### Error Codes
- `INSUFFICIENT_BALANCE`: Not enough TAC tokens
- `INVALID_REFERRAL_CODE`: Code doesn't exist
- `PHONE_NOT_FOUND`: No gift for phone number
- `SLOTS_FULL`: Referrer's level 1 is full
- `ALREADY_REFERRED`: User already has referrer

## Integration Example

### Frontend Integration
```typescript
// Track referral
const result = await supabaseClient.functions.invoke('referral-system-api', {
  method: 'POST',
  body: { 
    user_id: user.id, 
    referral_code: 'REF123456' 
  },
  path: '/track-referral'
})

// Create gift
const giftResult = await supabaseClient.functions.invoke('referral-system-api', {
  method: 'POST',
  body: {
    sender_id: user.id,
    recipient_phone: '${phoneNumber}',
    token_amount: 100,
    message: 'Welcome!'
  },
  path: '/create-gift'
})
```

### Backend Integration
```typescript
// After AI generation
await supabaseService.rpc('distribute_referral_commissions', {
  p_ai_usage_user_id: userId,
  p_cost_tokens: costTokens,
  p_generation_type: 'image'
})
```