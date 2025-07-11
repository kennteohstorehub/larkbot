# 🎯 Custom Filtering Guide

## Overview

The Intercom-Lark automation system provides **powerful filtering capabilities** to capture and transfer only the specific ticket types and custom data attributes you need. This guide shows you exactly how to set up and use these filters.

## 🔧 **Available Filtering Methods**

### **1. API Endpoint Filtering**
Direct API calls with custom parameters:

```bash
# Get tickets with custom attributes
curl -X GET "http://localhost:3001/api/tickets?custom_department=engineering&custom_priority=high"

# Get tickets by type and category
curl -X GET "http://localhost:3001/api/tickets?type=bug&category=urgent&source=email"

# Advanced filtering with multiple criteria
curl -X POST "http://localhost:3001/api/tickets/filter" \
  -H "Content-Type: application/json" \
  -d '{
    "customAttributes": {
      "attributes": {
        "department": "engineering",
        "priority": "high",
        "team": "backend"
      },
      "matchMode": "all"
    },
    "ticketType": {
      "types": ["bug", "technical"],
      "categories": ["urgent", "critical"],
      "sources": ["email", "api"]
    }
  }'
```

### **2. Chatbot Commands**
Interactive filtering through Lark chatbot:

```bash
# Custom attribute filtering
/tickets-custom custom=department:engineering,priority:high
/tickets-custom type=bug,feature custom=team:backend match=all

# Ticket type filtering
/tickets-type type=bug,technical category=urgent source=email
/tickets-type type=feature category=enhancement

# Advanced filtering
/filter-tickets customAttributes.department=engineering customAttributes.priority=high
/filter-tickets state=open priority=high assignee=agent123
```

### **3. Phase 2 Programmatic Filtering**
Using the Phase 2 filtering engine directly:

```javascript
const phase2 = require('./src/phases/phase2');

// Custom attributes filter
const customFiltered = await phase2.applyFilters(tickets, {
  customAttributes: {
    attributes: {
      department: 'engineering',
      priority: 'high',
      team: 'backend'
    },
    matchMode: 'all' // or 'any'
  }
});

// Ticket type filter
const typeFiltered = await phase2.applyFilters(tickets, {
  ticketType: {
    types: ['bug', 'technical'],
    categories: ['urgent', 'critical'],
    sources: ['email', 'api']
  }
});

// Compound filter with multiple conditions
const compoundFiltered = await phase2.applyFilters(tickets, {
  compound: {
    logic: 'AND', // or 'OR'
    conditions: [
      {
        filter: 'customAttributes',
        criteria: {
          attributes: { department: 'engineering' },
          matchMode: 'any'
        }
      },
      {
        filter: 'priority',
        criteria: { priority: 'high' }
      }
    ]
  }
});
```

## 🎯 **Specific Use Cases**

### **Use Case 1: Engineering Team Tickets Only**

**Requirement**: Only capture tickets from engineering department with high priority

```javascript
// Configuration
const filterConfig = {
  customAttributes: {
    attributes: {
      department: 'engineering',
      priority: 'high'
    },
    matchMode: 'all'
  },
  ticketType: {
    types: ['bug', 'technical', 'feature'],
    categories: ['urgent', 'critical']
  }
};

// API Call
curl -X POST "http://localhost:3001/api/tickets/filter" \
  -H "Content-Type: application/json" \
  -d '{"customAttributes":{"attributes":{"department":"engineering","priority":"high"},"matchMode":"all"}}'

// Chatbot Command
/tickets-custom custom=department:engineering,priority:high type=bug,technical,feature
```

### **Use Case 2: Billing Issues with Customer Tier**

**Requirement**: Only billing-related tickets from premium customers

```javascript
// Configuration
const filterConfig = {
  customAttributes: {
    attributes: {
      customer_tier: 'premium',
      issue_type: 'billing'
    },
    matchMode: 'all'
  },
  ticketType: {
    categories: ['billing', 'payment'],
    sources: ['email', 'chat']
  }
};

// Chatbot Command
/tickets-custom custom=customer_tier:premium,issue_type:billing category=billing,payment
```

### **Use Case 3: Critical Technical Issues**

**Requirement**: Only critical technical issues that need immediate attention

```javascript
// Configuration
const filterConfig = {
  compound: {
    logic: 'AND',
    conditions: [
      {
        filter: 'customAttributes',
        criteria: {
          attributes: { severity: 'critical' },
          matchMode: 'any'
        }
      },
      {
        filter: 'priority',
        criteria: { priority: 'urgent' }
      },
      {
        filter: 'ticketType',
        criteria: {
          types: ['bug', 'technical'],
          categories: ['critical', 'urgent']
        }
      }
    ]
  }
};

// Chatbot Command
/filter-tickets customAttributes.severity=critical priority=urgent ticketType.types=bug,technical
```

## 🔍 **Custom Data Attribute Operators**

The system supports advanced comparison operators for custom attributes:

```javascript
// Exact match
{ department: 'engineering' }

// Multiple values (OR logic)
{ department: ['engineering', 'product'] }

// Advanced operators
{
  created_date: {
    value: '2024-01-01',
    operator: 'greaterThan'
  },
  customer_score: {
    value: 80,
    operator: 'greaterThanOrEqual'
  },
  description: {
    value: 'urgent',
    operator: 'contains'
  }
}
```

**Available Operators:**
- `equals` - Exact match
- `contains` - String contains
- `startsWith` - String starts with
- `endsWith` - String ends with
- `greaterThan` - Numeric greater than
- `lessThan` - Numeric less than
- `greaterThanOrEqual` - Numeric greater than or equal
- `lessThanOrEqual` - Numeric less than or equal
- `regex` - Regular expression match
- `notEquals` - Not equal to

## 🚀 **Setting Up Automated Filtering**

### **1. Environment Configuration**

Add your specific filters to the environment configuration:

```bash
# .env file
CUSTOM_FILTER_DEPARTMENT=engineering
CUSTOM_FILTER_PRIORITY=high,urgent
CUSTOM_FILTER_TYPES=bug,technical,feature
CUSTOM_FILTER_CATEGORIES=urgent,critical
CUSTOM_FILTER_MATCH_MODE=all
```

### **2. Webhook Configuration**

Set up automatic filtering for incoming webhooks:

```javascript
// In webhook handler
const webhookFilters = {
  customAttributes: {
    attributes: {
      department: process.env.CUSTOM_FILTER_DEPARTMENT,
      priority: process.env.CUSTOM_FILTER_PRIORITY?.split(',')
    },
    matchMode: process.env.CUSTOM_FILTER_MATCH_MODE || 'any'
  },
  ticketType: {
    types: process.env.CUSTOM_FILTER_TYPES?.split(','),
    categories: process.env.CUSTOM_FILTER_CATEGORIES?.split(',')
  }
};
```

### **3. Lark Integration Setup**

Configure automatic Lark notifications for filtered tickets:

```javascript
// Chatbot subscription with filters
/subscribe custom=department:engineering,priority:high
/subscribe type=bug,technical category=urgent

// This will only send notifications for tickets matching your criteria
```

## 📊 **Export Filtered Data**

Export only the tickets that match your criteria:

```bash
# Export filtered tickets to JSON
curl -X POST "http://localhost:3001/export/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "json",
    "filters": {
      "customAttributes": {
        "attributes": {
          "department": "engineering",
          "priority": "high"
        },
        "matchMode": "all"
      }
    }
  }'

# Export to CSV for analysis
curl -X POST "http://localhost:3001/export/tickets" \
  -H "Content-Type: application/json" \
  -d '{
    "format": "csv",
    "filters": {
      "ticketType": {
        "types": ["bug", "technical"],
        "categories": ["urgent", "critical"]
      }
    }
  }'
```

## 🔄 **Real-time Filtering**

Set up real-time filtering for continuous monitoring:

```javascript
// Phase 3 automation with filtering
const automationConfig = {
  webhooks: {
    enabled: true,
    filters: {
      customAttributes: {
        attributes: {
          department: 'engineering',
          priority: ['high', 'urgent']
        },
        matchMode: 'any'
      }
    }
  },
  larkIntegration: {
    enabled: true,
    notifyOnMatch: true,
    channels: ['engineering-alerts']
  }
};
```

## 📈 **Performance Optimization**

For large datasets, optimize filtering performance:

```javascript
// Use pagination with filtering
const filteredTickets = await phase2.applyFilters(tickets, filterConfig, {
  pagination: {
    page: 1,
    perPage: 100
  },
  caching: {
    enabled: true,
    ttl: 300 // 5 minutes
  }
});

// Use indexing for frequently filtered attributes
const indexedFilters = {
  customAttributes: {
    attributes: {
      department: 'engineering' // This will use index if available
    },
    useIndex: true
  }
};
```

## 🎯 **Quick Start Examples**

### **Example 1: Simple Department Filter**
```bash
# Get only engineering tickets
/tickets-custom custom=department:engineering

# API equivalent
curl "http://localhost:3001/api/tickets?custom_department=engineering"
```

### **Example 2: Priority and Type Filter**
```bash
# Get high priority bugs
/tickets-custom custom=priority:high type=bug

# API equivalent
curl -X POST "http://localhost:3001/api/tickets/filter" \
  -d '{"customAttributes":{"attributes":{"priority":"high"}},"ticketType":{"types":["bug"]}}'
```

### **Example 3: Complex Multi-Criteria Filter**
```bash
# Get urgent engineering tickets from email
/filter-tickets customAttributes.department=engineering customAttributes.priority=urgent ticketType.sources=email

# API equivalent
curl -X POST "http://localhost:3001/api/tickets/filter" \
  -d '{"compound":{"logic":"AND","conditions":[{"filter":"customAttributes","criteria":{"attributes":{"department":"engineering","priority":"urgent"}}},{"filter":"ticketType","criteria":{"sources":["email"]}}]}}'
```

## 🛠️ **Testing Your Filters**

Test your filtering setup:

```bash
# Test with mock data
npm run phase2 -- --demo --filter='{"customAttributes":{"attributes":{"department":"engineering"}}}'

# Test chatbot commands
curl -X POST "http://localhost:3001/webhook/lark/test-message" \
  -H "Content-Type: application/json" \
  -d '{"content":"/tickets-custom custom=department:engineering,priority:high","chatId":"test","userId":"test"}'

# Verify export functionality
curl -X POST "http://localhost:3001/export/tickets" \
  -d '{"format":"json","filters":{"customAttributes":{"attributes":{"department":"engineering"}}}}'
```

## 📞 **Support**

- **Documentation**: Check `README.md` for basic setup
- **API Reference**: See `IMPLEMENTATION_SUMMARY.md` for detailed API documentation
- **Troubleshooting**: Check logs in `logs/` directory
- **Advanced Configuration**: Refer to `PRD.md` for comprehensive requirements

---

**🎯 The system is designed to be extremely flexible - you can filter by any combination of ticket types, custom attributes, priorities, states, and more. The key is to identify your specific criteria and use the appropriate filtering method.** 