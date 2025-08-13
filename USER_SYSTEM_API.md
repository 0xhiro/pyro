# User System API Documentation

## Overview

The user system allows people who are not creators to register, manage their profiles, promote their tokens, and build a social network around token burning activities. Users can follow each other and showcase their token portfolios.

## Core Features

### 1. User Management
- User registration and profile management
- Wallet-based authentication
- Username system with uniqueness validation
- Profile customization (bio, social links, etc.)

### 2. Token Portfolio Management
- Users can add tokens they want to promote
- Token information includes name, symbol, ticker, market cap, etc.
- Users can update and remove tokens from their portfolio

### 3. Social Features
- Follow/unfollow other users
- Public/private profile settings
- User discovery and search

### 4. Burn Integration
- Track user burn statistics across all creators
- Allow users to promote their tokens when burning
- Maintain detailed burn history per user

## API Endpoints

### User Management

#### POST /users
Create a new user account.

**Request Body:**
```json
{
  "wallet": "string (required)",
  "username": "string (optional, 3-30 chars)",
  "displayName": "string (optional, max 100 chars)",
  "bio": "string (optional, max 500 chars)",
  "profileImageUrl": "string (optional)",
  "websiteUrl": "string (optional)",
  "twitterHandle": "string (optional)",
  "telegramHandle": "string (optional)",
  "discordHandle": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "wallet": "string",
    "username": "string",
    "displayName": "string",
    "tokens": [],
    "following": [],
    "followers": [],
    "totalTokensBurned": 0,
    "totalBurns": 0,
    "joinedAt": "Date",
    "lastActiveAt": "Date",
    "isPublic": true,
    "allowDirectMessages": true
  },
  "message": "User created successfully"
}
```

#### GET /users/:id
Get user by ID.

#### GET /users/wallet/:wallet
Get user by wallet address.

#### GET /users/username/:username
Get user by username.

#### PATCH /users/:id
Update user profile.

#### DELETE /users/:id
Delete user account (removes all associated data).

### User Discovery

#### GET /users
Get all users with pagination and search.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `search`: Search query for username, displayName, or bio

#### GET /users/top
Get top users by burn statistics.

**Query Parameters:**
- `limit`: Number of users to return (default: 10, max: 50)

#### GET /users/by-token/:tokenMint
Get users who promote a specific token.

### Token Management

#### POST /users/:id/tokens
Add a token to user's portfolio.

**Request Body:**
```json
{
  "mint": "string (required)",
  "name": "string (required)",
  "symbol": "string (required)",
  "decimals": "number (required, 0-18)",
  "iconUrl": "string (optional)",
  "ticker": "string (optional)",
  "marketCap": "number (optional)",
  "dexUrl": "string (optional)",
  "websiteUrl": "string (optional)",
  "description": "string (optional, max 1000 chars)"
}
```

#### GET /users/:id/tokens
Get user's token portfolio.

#### PATCH /users/:id/tokens/:tokenMint
Update a specific token in user's portfolio.

#### DELETE /users/:id/tokens/:tokenMint
Remove a token from user's portfolio.

### Social Features

#### POST /users/:id/follow/:targetId
Follow another user.

#### POST /users/:id/unfollow/:targetId
Unfollow a user.

#### POST /users/:id/is-following/:targetId
Check if user is following another user.

#### GET /users/:id/followers
Get user's followers with pagination.

#### GET /users/:id/following
Get users that this user follows with pagination.

### Burn Statistics

#### GET /users/:id/burn-stats
Get user's overall burn statistics across all creators.

#### GET /users/:id/burn-stats/:creatorMint
Get user's burn statistics for a specific creator.

#### GET /users/:id/creator-burns
Get all creator tokens burned by a user (simple overview).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "creatorMint": "string",
      "creatorInfo": {
        "name": "Creator Name",
        "symbol": "SYMBOL",
        "iconUrl": "string",
        "ticker": "$SYMBOL",
        "decimals": 9
      },
      "totalBurned": 1000,
      "burnCount": 5,
      "firstBurnAt": "2024-01-01T00:00:00.000Z",
      "lastBurnAt": "2024-01-15T12:00:00.000Z"
    }
  ],
  "summary": {
    "totalCreators": 3,
    "totalBurned": 5000,
    "totalBurns": 15
  }
}
```

#### GET /users/:id/creator-burns/detailed
Get detailed creator tokens burned by a user with burn history and pagination.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `creatorMint`: Filter by specific creator (optional)
- `sortBy`: Sort by `totalBurned`, `burnCount`, or `lastBurnAt` (default: `totalBurned`)
- `sortOrder`: `asc` or `desc` (default: `desc`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "creatorMint": "string",
      "creatorInfo": {
        "name": "Creator Name",
        "symbol": "SYMBOL",
        "iconUrl": "string",
        "ticker": "$SYMBOL",
        "decimals": 9,
        "totalTokensBurned": 50000
      },
      "totalBurned": 1000,
      "burnCount": 5,
      "firstBurnAt": "2024-01-01T00:00:00.000Z",
      "lastBurnAt": "2024-01-15T12:00:00.000Z",
      "burnHistory": [
        {
          "amount": 500,
          "timestamp": "2024-01-15T12:00:00.000Z",
          "sessionId": "session_id",
          "promotedTokenMint": "promoted_token_mint"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 3,
    "hasMore": false
  },
  "summary": {
    "totalCreators": 3,
    "totalBurned": 5000,
    "totalBurns": 15
  }
}
```

#### GET /users/wallet/:wallet/creator-burns
Get creator tokens burned by wallet address (for non-registered users).

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `creatorMint`: Filter by specific creator (optional)

**Response:** Same format as `/users/:id/creator-burns`

### Enhanced Burn Endpoint

#### POST /burns
Create a burn transaction (enhanced with user features).

**Enhanced Request Body:**
```json
{
  "creatorMint": "string (required)",
  "wallet": "string (required)",
  "amount": "number (required)",
  "sessionId": "string (optional)",
  "advertisingMetadata": {
    "message": "string (optional)",
    "websiteUrl": "string (optional)",
    "imageUrl": "string (optional)",
    "contact": "string (optional)"
  },
  "userId": "string (optional) - User ID for tracking",
  "promotedTokenMint": "string (optional) - Token to promote during burn"
}
```

**Notes:**
- If `promotedTokenMint` is provided, `userId` is required
- The promoted token must exist in the user's token portfolio
- Burn statistics are automatically tracked for the user

## Data Models

### UserDoc
```typescript
interface UserDoc {
  _id?: ObjectId;
  wallet: string;
  username?: string;
  displayName?: string;
  bio?: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  twitterHandle?: string;
  telegramHandle?: string;
  discordHandle?: string;
  
  // User tokens for promotion
  tokens: UserTokenDoc[];
  
  // Social features
  following: ObjectId[];
  followers: ObjectId[];
  
  // Statistics
  totalTokensBurned: number;
  totalBurns: number;
  joinedAt: Date;
  lastActiveAt: Date;
  
  // Settings
  isPublic: boolean;
  allowDirectMessages: boolean;
}
```

### UserTokenDoc
```typescript
interface UserTokenDoc {
  _id?: ObjectId;
  mint: string;
  name: string;
  symbol: string;
  iconUrl?: string;
  decimals: number;
  ticker?: string;
  marketCap?: number;
  dexUrl?: string;
  websiteUrl?: string;
  description?: string;
  addedAt: Date;
}
```

### UserBurnStatsDoc
```typescript
interface UserBurnStatsDoc {
  _id?: ObjectId;
  userId: ObjectId;
  creatorMint: string;
  tokensBurned: number;
  burnCount: number;
  firstBurnAt: Date;
  lastBurnAt: Date;
}
```

## Database Collections

### users
Main user collection storing user profiles and token portfolios.

### user_follows
Stores follow relationships between users for efficient querying.

### user_burn_stats
Tracks detailed burn statistics per user per creator.

## Usage Examples

### 1. Register a New User
```javascript
const response = await fetch('/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    wallet: 'ABC123...',
    username: 'tokentrader123',
    displayName: 'Token Trader',
    bio: 'Passionate about DeFi and token burning',
    twitterHandle: '@tokentrader123'
  })
});
```

### 2. Add a Token to Portfolio
```javascript
const response = await fetch('/api/users/USER_ID/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mint: 'TOKEN_MINT_ADDRESS',
    name: 'My Awesome Token',
    symbol: 'MAT',
    decimals: 9,
    ticker: '$MAT',
    marketCap: 1000000,
    description: 'The next big thing in DeFi'
  })
});
```

### 3. Burn with Token Promotion
```javascript
const response = await fetch('/api/burns', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    creatorMint: 'CREATOR_MINT',
    wallet: 'USER_WALLET',
    amount: 100,
    userId: 'USER_ID',
    promotedTokenMint: 'TOKEN_TO_PROMOTE',
    advertisingMetadata: {
      message: 'Check out my awesome token!',
      websiteUrl: 'https://mytoken.com'
    }
  })
});
```

### 4. Follow Another User
```javascript
const response = await fetch('/api/users/USER_ID/follow/TARGET_USER_ID', {
  method: 'POST'
});
```

### 5. Get All Creator Tokens Burned by User
```javascript
// Simple overview
const response = await fetch('/api/users/USER_ID/creator-burns');

// Detailed with pagination and filtering
const response = await fetch('/api/users/USER_ID/creator-burns/detailed?page=1&limit=10&sortBy=totalBurned&sortOrder=desc');

// Filter by specific creator
const response = await fetch('/api/users/USER_ID/creator-burns/detailed?creatorMint=CREATOR_MINT_ADDRESS');
```

### 6. Get Creator Burns by Wallet (Non-Registered Users)
```javascript
const response = await fetch('/api/users/wallet/WALLET_ADDRESS/creator-burns?page=1&limit=20');
```

## Best Practices

1. **User Registration**: Always check if a user exists by wallet address before creating a new account.

2. **Token Validation**: Ensure token information is accurate and up-to-date when adding to portfolios.

3. **Privacy**: Respect user privacy settings when displaying user information.

4. **Rate Limiting**: Implement rate limiting for social actions (follow/unfollow) to prevent abuse.

5. **Data Consistency**: Use the provided service methods to maintain data consistency across collections.

6. **Error Handling**: Always handle errors gracefully and provide meaningful error messages.

## Security Considerations

1. **Wallet Verification**: Implement proper wallet signature verification before allowing user actions.

2. **Input Validation**: All inputs are validated using middleware functions.

3. **Access Control**: Users can only modify their own profiles and data.

4. **Data Sanitization**: User-provided content should be sanitized to prevent XSS attacks.

5. **Follow Limits**: Consider implementing limits on the number of users one can follow.

This user system provides a comprehensive foundation for building a social token burning platform where users can promote their tokens, build communities, and track their activities across the ecosystem.
