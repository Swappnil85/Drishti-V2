# Database Schema

## Overview

The Drishti application uses PostgreSQL as the primary database. The schema is designed to support user management, visual analysis storage, and application metadata.

## Entity Relationship Diagram

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    users    │    │ visual_analyses │    │      files      │
├─────────────┤    ├─────────────────┤    ├─────────────────┤
│ id (PK)     │◄── ┤ user_id (FK)    │    │ id (PK)         │
│ email       │    │ id (PK)         │◄── ┤ analysis_id(FK) │
│ name        │    │ file_id (FK)    ├──► │ filename        │
│ password    │    │ description     │    │ file_path       │
│ created_at  │    │ confidence      │    │ file_size       │
│ updated_at  │    │ tags            │    │ mime_type       │
│ is_active   │    │ created_at      │    │ created_at      │
└─────────────┘    │ updated_at      │    └─────────────────┘
                   └─────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │   ai_responses  │
                   ├─────────────────┤
                   │ id (PK)         │
                   │ analysis_id(FK) │
                   │ service_name    │
                   │ raw_response    │
                   │ processed_data  │
                   │ created_at      │
                   └─────────────────┘
```

## Table Definitions

### users
Stores user account information and authentication data.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### files
Stores metadata about uploaded files (images, videos).

```sql
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- for videos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    checksum VARCHAR(64) -- for duplicate detection
);

CREATE INDEX idx_files_mime_type ON files(mime_type);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_checksum ON files(checksum);
```

### visual_analyses
Stores the results of AI-powered visual analysis.

```sql
CREATE TABLE visual_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_visual_analyses_user_id ON visual_analyses(user_id);
CREATE INDEX idx_visual_analyses_file_id ON visual_analyses(file_id);
CREATE INDEX idx_visual_analyses_created_at ON visual_analyses(created_at);
CREATE INDEX idx_visual_analyses_tags ON visual_analyses USING GIN(tags);
```

### ai_responses
Stores raw and processed responses from AI services.

```sql
CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES visual_analyses(id) ON DELETE CASCADE,
    service_name VARCHAR(100) NOT NULL, -- 'openai', 'google-vision', etc.
    raw_response JSONB NOT NULL,
    processed_data JSONB,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_responses_analysis_id ON ai_responses(analysis_id);
CREATE INDEX idx_ai_responses_service ON ai_responses(service_name);
```

## Data Types and Constraints

### UUID Usage
- All primary keys use UUID for better security and distribution
- UUIDs prevent enumeration attacks
- Better for distributed systems

### Timestamps
- All timestamps use `TIMESTAMP WITH TIME ZONE`
- Automatic `created_at` and `updated_at` tracking
- UTC storage with timezone awareness

### JSON Storage
- User preferences stored as JSONB
- AI response metadata stored as JSONB
- Flexible schema for evolving requirements

## Indexing Strategy

### Performance Indexes
- Primary keys (automatic)
- Foreign key relationships
- Frequently queried columns (email, created_at)
- Array columns (tags) using GIN indexes

### Query Optimization
- Composite indexes for common query patterns
- Partial indexes for filtered queries
- Regular ANALYZE and VACUUM operations

## Migration Strategy

### Schema Versioning
- Use migration files for schema changes
- Drizzle Kit for migration management
- Backward compatibility considerations

### Data Migration
- Safe migration procedures
- Rollback strategies
- Data validation after migrations

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication

### Recovery Procedures
- Documented recovery steps
- Regular recovery testing
- RTO/RPO targets defined

## Security Considerations

### Data Protection
- Encrypted connections (SSL/TLS)
- Row-level security policies
- Audit logging for sensitive operations
- Regular security updates

### Access Control
- Role-based access control (RBAC)
- Principle of least privilege
- Database user separation by environment
