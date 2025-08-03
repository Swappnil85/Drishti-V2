# API Reference Template

## Purpose

This template provides standardized patterns for referencing Drishti's API documentation across epic documents. Use these patterns to eliminate redundancy and maintain consistency.

## 📚 Central API Documentation

**Primary Source**: [Drishti API Documentation](../api/API_OVERVIEW.md)

### Core API Files
- **[API Overview](../api/API_OVERVIEW.md)** - API principles, authentication, rate limiting
- **[API Endpoints](../api/ENDPOINTS.md)** - Complete endpoint documentation
- **[Error Handling](../api/ERROR_HANDLING.md)** - Error codes and handling strategies

## 🔗 Reference Patterns

### Full API Stack Reference
```markdown
**API Documentation**: See [Drishti API Documentation](../api/API_OVERVIEW.md) for complete specifications.
```

### Specific API Categories
```markdown
**Authentication API**: See [Authentication Endpoints](../api/ENDPOINTS.md#authentication-endpoints) for complete specifications.

**User Management API**: See [User Management Endpoints](../api/ENDPOINTS.md#user-management-endpoints) for details.

**File Management API**: See [File Management Endpoints](../api/ENDPOINTS.md#file-management-endpoints) for specifications.

**Error Handling**: See [API Error Handling](../api/ERROR_HANDLING.md) for error codes and responses.
```

### Epic-Specific API Sections
```markdown
**Base API**: See [Drishti API Documentation](../api/API_OVERVIEW.md) for core specifications.

**Epic {N} API Extensions**:
*Epic {N} introduces the following new endpoints*

- **New Endpoint Category**: Brief description
- **Enhanced Features**: Epic-specific API enhancements
- **Integration Points**: How epic APIs integrate with core system
```

## 📋 Epic API Documentation Template

### When to Document Epic-Specific APIs

**Document in Epic**:
- New endpoints introduced by the epic
- Epic-specific API modifications
- Integration patterns unique to the epic
- Epic-specific error handling

**Reference Central Documentation**:
- Standard CRUD operations
- Common authentication patterns
- Standard error responses
- General API principles

### Epic API Section Template

```markdown
## 🔌 API Implementation

### Core API
**API Documentation**: See [Drishti API Documentation](../../api/API_OVERVIEW.md) for complete specifications.

### Epic {N} API Extensions
*Epic {N} introduces {category} endpoints*

#### New Endpoints
- **POST /epic-specific/endpoint** - Brief description
- **GET /epic-specific/resource** - Brief description
- **PUT /epic-specific/resource/:id** - Brief description

#### Integration Notes
- **Authentication**: Uses standard JWT authentication (see [Auth API](../../api/ENDPOINTS.md#authentication-endpoints))
- **Error Handling**: Follows standard error format (see [Error Handling](../../api/ERROR_HANDLING.md))
- **Rate Limiting**: Standard limits apply (see [API Overview](../../api/API_OVERVIEW.md#rate-limiting))

#### Epic-Specific Considerations
- **Data Validation**: Epic-specific validation rules
- **Business Logic**: Epic-specific processing
- **Performance**: Epic-specific optimization notes
```

## ✅ Usage Guidelines

### When to Use References
1. **Standard API Operations**: Always reference central documentation
2. **Common Patterns**: Link to established patterns in central docs
3. **Error Handling**: Reference standard error documentation
4. **Authentication**: Link to authentication endpoint documentation

### When to Document in Epic
1. **New Endpoints**: Document endpoints introduced by the epic
2. **Modified Behavior**: Document changes to existing patterns
3. **Integration Specifics**: Document epic-specific integration details
4. **Business Logic**: Document epic-specific API business rules

### Reference Link Patterns
```markdown
<!-- Good: Specific section references -->
See [Authentication Endpoints](../../api/ENDPOINTS.md#authentication-endpoints)

<!-- Good: Complete API reference -->
See [Drishti API Documentation](../../api/API_OVERVIEW.md)

<!-- Bad: Duplicating endpoint documentation -->
### POST /auth/login
Authenticate user and return tokens...
```

## 📖 Examples

### Good Epic API Section
```markdown
## 🔌 API Implementation

### Core API
**API Documentation**: See [Drishti API Documentation](../../api/API_OVERVIEW.md) for complete specifications.

### Epic 3 Financial API Extensions
*Epic 3 introduces financial planning endpoints*

#### New Endpoints
- **POST /financial/accounts** - Create financial account
- **GET /financial/goals** - List financial goals
- **POST /financial/scenarios** - Create planning scenario

#### Integration Notes
- **Authentication**: Standard JWT (see [Auth API](../../api/ENDPOINTS.md#authentication-endpoints))
- **Validation**: Zod schemas for financial data
- **Business Rules**: Complex financial calculations and validations
```

### Bad Epic API Section
```markdown
## API Documentation

### Authentication
#### POST /auth/login
Authenticate user and return tokens.

Request Body:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

<!-- This duplicates central API documentation -->
```

## 🎯 Benefits

### Reduced Redundancy
- **Single Source**: Central API documentation is the authority
- **No Duplication**: Epic docs focus only on epic-specific APIs
- **Consistent Updates**: Changes made once in central location

### Improved Maintainability
- **Easier Updates**: API changes updated in one place
- **Consistent Format**: Standardized API documentation format
- **Clear Ownership**: Central vs. epic-specific API documentation

### Better User Experience
- **Complete Information**: Central docs have full API specifications
- **Epic Context**: Epic docs provide implementation context
- **Easy Navigation**: Clear links between documents

### Enhanced Quality
- **Consistency**: Uniform API documentation approach
- **Accuracy**: Single source reduces inconsistencies
- **Completeness**: Central docs ensure comprehensive coverage

---

**Usage**: Reference this template when documenting APIs in epic documents to maintain consistency and reduce redundancy.