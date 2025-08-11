# Frontend V2 – Architecture (Planning)

## Feature-Slice Layout
- screens/
- features/
- shared/
- api/adapter/
- state/

## State Management
- React Query for server state + lightweight local state
- Error boundary patterns documented

## API Client Adapter
- Interceptors: auth token attach, 401 refresh, error mapping
- Retry/backoff policy documented

## Testing
- React Testing Library for components
- Basic E2E outline (to be defined)

## CI Hooks (to be defined)
- Lint, typecheck, unit tests; smoke test runner placeholder
