# Technology Stack Reference Template

## Purpose
This template provides standardized references to Drishti's technology stack to eliminate redundancy across epic documentation. Instead of repeating full technology descriptions, epic documents should reference this template.

## Quick Reference Patterns

### 🔗 **Full Stack Reference**
```markdown
**Technology Stack**: See [Technology Stack](../architecture/TECH_STACK.md) for complete details.
```

### 🔗 **Frontend Stack Reference**
```markdown
**Frontend**: React Native + Expo SDK 49 + TypeScript. See [Frontend Stack](../architecture/TECH_STACK.md#frontend-mobile-app) for details.
```

### 🔗 **Backend Stack Reference**
```markdown
**Backend**: Node.js + Fastify + TypeScript + PostgreSQL. See [Backend Stack](../architecture/TECH_STACK.md#backend-api) for details.
```

### 🔗 **Database Reference**
```markdown
**Database**: PostgreSQL 15+ with Drizzle ORM. See [Database Stack](../architecture/TECH_STACK.md#database--orm) for details.
```

### 🔗 **Development Tools Reference**
```markdown
**Development**: TypeScript, ESLint, Prettier, Jest. See [Development Tools](../architecture/TECH_STACK.md#development-tools) for details.
```

## Epic-Specific Technology Sections

### 📋 **Template for Epic Technical Guides**

```markdown
## 🔧 Technology Implementation

### Core Stack
**Technology Stack**: See [Drishti Technology Stack](../../architecture/TECH_STACK.md) for complete specifications.

### Epic-Specific Technologies
*Only list technologies specific to this epic that are not in the main stack*

- **[Technology Name]**: [Brief description and epic-specific usage]
- **[Library Name]**: [Epic-specific implementation details]

### Implementation Notes
*Epic-specific implementation considerations, configurations, or customizations*

### Dependencies
*Epic-specific dependencies not covered in main stack*
```

## Common Technology Patterns

### 🎯 **Authentication Stack**
```markdown
**Authentication**: JWT + bcryptjs + Expo SecureStore. See [Authentication Guide](../authentication/AUTHENTICATION_GUIDE.md) and [Tech Stack](../architecture/TECH_STACK.md#authentication--security).
```

### 🎯 **Mobile Development Stack**
```markdown
**Mobile**: React Native 0.72.3 + Expo SDK 49 + TypeScript + Zustand. See [Mobile Stack](../architecture/TECH_STACK.md#frontend-mobile-app).
```

### 🎯 **API Development Stack**
```markdown
**API**: Fastify 4.21+ + TypeScript + PostgreSQL + Drizzle ORM. See [Backend Stack](../architecture/TECH_STACK.md#backend-api).
```

### 🎯 **Testing Stack**
```markdown
**Testing**: Jest + Testing Library + Supertest. See [Testing Tools](../architecture/TECH_STACK.md#testing).
```

## Usage Guidelines

### ✅ **Do Use References When:**
- Mentioning standard Drishti technologies
- Describing the overall tech stack
- Listing common development tools
- Referencing authentication technologies
- Discussing database technologies

### ❌ **Don't Repeat When:**
- Technology is already documented in main TECH_STACK.md
- Implementation details are standard across epics
- Configuration is standard/default
- Rationale is already explained in main documentation

### 📝 **Do Document When:**
- Epic introduces new technologies not in main stack
- Epic-specific configuration or customization is required
- Epic has unique implementation considerations
- Epic uses experimental or future technologies

## Reference Examples

### ✅ **Good Epic Technology Section**
```markdown
## Technology Implementation

**Core Stack**: See [Drishti Technology Stack](../../architecture/TECH_STACK.md).

**Epic-Specific Additions**:
- **WatermelonDB**: Local-first database for offline functionality
- **Expo SecureStore**: Hardware-backed secure storage for encryption keys
- **Custom Encryption Service**: AES-256 encryption for sensitive data

**Implementation Notes**:
- WatermelonDB configured with custom schema for financial data
- Encryption keys rotated every 30 days
- Offline-first architecture with background sync
```

### ❌ **Avoid Redundant Sections**
```markdown
## Technology Stack (DON'T DO THIS)

**Frontend**:
- React Native 0.72.3 - Cross-platform mobile development
- Expo SDK 49 - Development tooling and native APIs
- TypeScript 5.1+ - Type safety and developer experience
- React Navigation v6 - Navigation library
- Zustand - Lightweight state management

**Backend**:
- Node.js 18+ - JavaScript runtime
- Fastify 4.21+ - High-performance web framework
- TypeScript 5.1+ - Type safety and developer experience
- PostgreSQL 15+ - Primary database
- Drizzle ORM - Type-safe database toolkit

*This duplicates information already in TECH_STACK.md*
```

## Benefits of This Approach

### 📈 **Advantages**
- **Reduced Redundancy**: Eliminates duplicate technology descriptions
- **Single Source of Truth**: All technology decisions documented in one place
- **Easier Maintenance**: Technology updates only need to be made in one file
- **Consistent Information**: Prevents inconsistencies across epic documents
- **Focused Epic Docs**: Epic documents focus on epic-specific implementation
- **Better Navigation**: Clear links to comprehensive technology information

### 🎯 **Implementation Impact**
- **Estimated Reduction**: 60-70% reduction in technology stack redundancy
- **Maintenance Efficiency**: 80% reduction in technology update effort
- **Documentation Quality**: Improved focus on epic-specific technical details
- **Developer Experience**: Faster information discovery and navigation

---

**Usage Instructions**: Copy the appropriate reference patterns into your epic documentation and customize only the epic-specific technology sections.