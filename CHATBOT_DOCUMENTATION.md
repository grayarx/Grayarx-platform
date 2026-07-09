# GrayArx Support Chatbot - Complete Documentation

## Overview

The GrayArx Support Chatbot is a sophisticated, production-grade AI-powered customer support system designed to provide 24/7 automated assistance for dealership inquiries. It combines advanced natural language processing, real-time analytics, intelligent conversation management, and comprehensive security features.

## Architecture

### Core Services

The chatbot is built on a modular architecture with 10 specialized services:

#### 1. NLP Service (`chatbotNLPService.ts`)
Advanced natural language processing for understanding user intent and extracting meaningful information.

**Features:**
- 17 intent types (pricing, features, demo, support, etc.)
- Entity extraction (email, phone, vehicle type, location, date, time)
- Semantic similarity calculation
- Follow-up question detection
- Topic shift analysis

**Usage:**
```typescript
import * as nlpService from "./server/_core/chatbotNLPService";

const result = nlpService.detectIntent("What is your pricing?");
// Returns: { intent: "pricing", confidence: 0.95, entities: [...], keywords: [...] }
```

#### 2. Analytics Service (`chatbotAnalyticsService.ts`)
Real-time tracking and analysis of conversation metrics.

**Features:**
- Conversation metrics (total, active, average length)
- User metrics (interactions, satisfaction, escalations)
- Event tracking (messages, escalations, resolutions)
- Quality scoring
- Trending analysis
- Language distribution

**Usage:**
```typescript
import * as analyticsService from "./server/_core/chatbotAnalyticsService";

analyticsService.trackMessageSent("conv1", "user1", { intent: "pricing" });
const metrics = analyticsService.getConversationMetrics();
```

#### 3. Memory Service (`chatbotMemoryService.ts`)
Persistent conversation context and history management.

**Features:**
- Conversation context storage
- Message history with metadata
- Entity tracking
- Conversation summarization
- Multi-format export (JSON, CSV, TXT)
- Conversation search
- Auto-cleanup of expired sessions

**Usage:**
```typescript
import * as memoryService from "./server/_core/chatbotMemoryService";

const conv = memoryService.createConversation("session1", "user1", "en");
memoryService.addMessage("session1", {
  id: "msg1",
  role: "user",
  content: "Hello",
  timestamp: Date.now()
});
```

#### 4. Sentiment Service (`chatbotSentimentService.ts`)
Emotional intelligence and escalation triggers.

**Features:**
- 7-level sentiment detection (very negative to very positive)
- Emotion recognition
- Escalation scoring
- Sentiment trend tracking
- Automatic escalation recommendations

**Usage:**
```typescript
import * as sentimentService from "./server/_core/chatbotSentimentService";

const sentiment = sentimentService.analyzeSentiment("I'm very frustrated!");
if (sentimentService.shouldEscalate(sentiment)) {
  // Escalate to human support
}
```

#### 5. Cache Service (`chatbotCacheService.ts`)
Performance optimization through intelligent caching.

**Features:**
- LRU cache with TTL support
- Multi-level caching (response, FAQ, entity, intent)
- Cache statistics and monitoring
- Cache warming
- Import/export for backup

**Usage:**
```typescript
import * as cacheService from "./server/_core/chatbotCacheService";

cacheService.cacheResponse("What is pricing?", "Our pricing is...", "en");
const cached = cacheService.getCachedResponse("What is pricing?", "en");
```

#### 6. Security Service (`chatbotSecurityService.ts`)
Comprehensive security and rate limiting.

**Features:**
- Rate limiting (global, per-user, per-IP)
- Input validation (SQL injection, XSS prevention)
- Output sanitization
- Sensitive data masking
- Suspicious pattern detection
- Security token generation
- Security headers

**Usage:**
```typescript
import * as securityService from "./server/_core/chatbotSecurityService";

const validation = securityService.validateInput(userInput);
if (!validation.valid) {
  throw new Error(validation.error);
}
```

#### 7. Webhook Service (`chatbotWebhookService.ts`)
External integrations and event-driven architecture.

**Features:**
- Webhook registration and management
- Event triggering (conversation.started, escalation.triggered, etc.)
- Retry logic with exponential backoff
- CRM integration (Salesforce, HubSpot, Pipedrive)
- Email/SMS/Slack notifications
- Delivery tracking and statistics

**Usage:**
```typescript
import * as webhookService from "./server/_core/chatbotWebhookService";

webhookService.registerWebhook({
  id: "crm_webhook",
  url: "https://api.salesforce.com/...",
  events: ["conversation.ended"],
  active: true,
  retryCount: 3,
  retryDelay: 60
});

webhookService.triggerWebhookEvent(
  "conversation.ended",
  { userId: "user1" },
  "conv1"
);
```

#### 8. Language Service (`chatbotLanguageService.ts`)
Multi-language support with regional dialects.

**Supported Languages:**
- English (en)
- Afrikaans (af)
- Zulu (zu)
- Xhosa (xh)
- Sotho (st)
- Tswana (tn)
- Venda (ve)

**Features:**
- Automatic language detection
- Language-specific prompts
- Localized greetings and error messages
- Language preference persistence

#### 9. Admin Router (`chatbotAdminRouter.ts`)
Administrative endpoints for management and monitoring.

**Endpoints:**
- `/chatbot/admin/metrics` - Get conversation metrics
- `/chatbot/admin/users` - Get user metrics
- `/chatbot/admin/events` - Get conversation events
- `/chatbot/admin/cache/stats` - Get cache statistics
- `/chatbot/admin/security/config` - Manage security settings
- `/chatbot/admin/webhooks` - Manage webhooks

#### 10. Enhanced Chatbot Router V2 (`supportChatbotRouterV2.ts`)
Main chatbot API with full service integration.

**Endpoints:**
- `POST /initializeSession` - Start new conversation
- `POST /sendMessage` - Send message and get response
- `GET /getConversationSummary` - Get conversation summary
- `POST /exportConversation` - Export conversation
- `POST /submitFeedback` - Submit user feedback

## API Reference

### Initialize Session

```typescript
POST /api/trpc/supportChatbotV2.initializeSession

Request:
{
  language?: "en" | "af" | "zu" | "xh" | "st" | "tn" | "ve",
  userId?: string,
  ipAddress?: string
}

Response:
{
  sessionId: string,
  language: string,
  greeting: string,
  rateLimit: {
    remaining: number,
    resetTime: number
  }
}
```

### Send Message

```typescript
POST /api/trpc/supportChatbotV2.sendMessage

Request:
{
  message: string,
  sessionId: string,
  language?: string,
  userId?: string,
  ipAddress?: string
}

Response:
{
  sessionId: string,
  response: string,
  intent: string,
  sentiment: string,
  entities: Array<{ type: string, value: string }>,
  suggestions: string[],
  rateLimit: { remaining: number, resetTime: number }
}
```

### Submit Feedback

```typescript
POST /api/trpc/supportChatbotV2.submitFeedback

Request:
{
  sessionId: string,
  rating: 1 | 2 | 3 | 4 | 5,
  comment?: string,
  userId?: string
}

Response:
{
  success: boolean
}
```

## Configuration

### Security Configuration

```typescript
securityService.updateSecurityConfig({
  enableRateLimit: true,
  enableInputValidation: true,
  enableOutputSanitization: true,
  maxInputLength: 5000,
  maxOutputLength: 10000,
  blockedKeywords: ["delete", "drop", "exec", ...]
});
```

### Rate Limiting

- **Global**: 100 requests per minute
- **Per User**: 30 requests per minute
- **Per IP**: 60 requests per minute

### Cache Configuration

- **Response Cache TTL**: 24 hours
- **FAQ Cache TTL**: 7 days
- **Entity Cache TTL**: 24 hours
- **Intent Cache TTL**: 24 hours
- **Max Cache Size**: 1000 entries per cache type

## Monitoring & Analytics

### Key Metrics

1. **Conversation Metrics**
   - Total conversations
   - Active conversations
   - Average conversation length
   - Average response time
   - User satisfaction score
   - Escalation rate
   - Resolution rate

2. **User Metrics**
   - Total interactions
   - Average satisfaction
   - Preferred language
   - Escalation count
   - Resolution count

3. **Performance Metrics**
   - Cache hit rate
   - Response time
   - Error rate
   - Webhook delivery success rate

### Admin Dashboard

Access analytics at `/admin/chatbot`:
- Real-time metrics dashboard
- Conversation search and review
- User analytics
- Webhook management
- Security settings
- Cache management

## Integration Examples

### Salesforce CRM Integration

```typescript
const crm = webhookService.createCRMIntegration("salesforce", "your-api-key");
// Automatically sends conversation data to Salesforce when resolved
```

### Slack Notifications

```typescript
const slack = webhookService.createSlackIntegration("https://hooks.slack.com/...");
// Sends escalation alerts to Slack channel
```

### Email Notifications

```typescript
const email = webhookService.createEmailNotificationWebhook("sendgrid");
// Sends resolution confirmations via email
```

## Best Practices

### 1. Rate Limiting
Always respect rate limits. Implement exponential backoff for retries.

### 2. Caching
Leverage caching for frequently asked questions to reduce LLM calls and improve response time.

### 3. Sentiment Monitoring
Monitor sentiment trends to identify product issues or customer satisfaction problems.

### 4. Escalation Handling
Configure escalation triggers based on sentiment and conversation complexity.

### 5. Data Privacy
Use the masking functions to protect sensitive customer information.

### 6. Analytics Review
Regularly review analytics to identify improvement opportunities.

## Troubleshooting

### High Response Time
- Check cache hit rate
- Review LLM response time
- Check database query performance

### High Escalation Rate
- Review sentiment analysis thresholds
- Check FAQ knowledge base completeness
- Analyze escalation patterns

### Rate Limit Exceeded
- Implement client-side request queuing
- Use exponential backoff for retries
- Consider upgrading rate limits

### Webhook Delivery Failures
- Check webhook URL accessibility
- Review webhook payload format
- Check retry configuration
- Review delivery logs

## Performance Optimization

### Caching Strategy
1. Cache common FAQ responses
2. Pre-warm cache with popular queries
3. Monitor cache hit rate
4. Adjust TTL based on content freshness

### Database Optimization
1. Index frequently searched fields
2. Archive old conversations
3. Use pagination for large result sets

### LLM Optimization
1. Use cached responses when available
2. Batch similar queries
3. Implement request deduplication

## Security Considerations

1. **Input Validation**: All user inputs are validated for SQL injection and XSS
2. **Output Sanitization**: All LLM responses are sanitized before display
3. **Rate Limiting**: Prevents abuse and DDoS attacks
4. **Sensitive Data**: Phone numbers, emails, and IDs are masked in logs
5. **Webhook Security**: All webhooks are signed and verified
6. **Encryption**: Sensitive data is encrypted at rest and in transit

## Testing

Run the comprehensive test suite:

```bash
pnpm test server/chatbot.test.ts
```

Test coverage includes:
- NLP intent detection
- Entity extraction
- Sentiment analysis
- Conversation memory
- Caching behavior
- Security validation
- Webhook management
- Integration flows

## Deployment

### Environment Variables

```
CHATBOT_MAX_INPUT_LENGTH=5000
CHATBOT_MAX_OUTPUT_LENGTH=10000
CHATBOT_CACHE_SIZE=1000
CHATBOT_RATE_LIMIT_WINDOW=60000
CHATBOT_RATE_LIMIT_MAX=100
```

### Scaling Considerations

1. **Horizontal Scaling**: Use Redis for distributed caching
2. **Database**: Use connection pooling
3. **Load Balancing**: Distribute requests across multiple instances
4. **Monitoring**: Set up alerts for key metrics

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the test suite for usage examples
3. Check analytics dashboard for insights
4. Contact support team

## Version History

- **v2.0** (Current): Complete rewrite with advanced services
- **v1.0**: Initial chatbot implementation

## License

© 2026 GrayArx. All rights reserved.
