# SmartGoals Testing Infrastructure

This document outlines the comprehensive testing infrastructure for the SmartGoals project.

## Overview

The project includes testing for both frontend (React/TypeScript) and backend (FastAPI/Python) components with:

- **Frontend Testing**: Vitest + React Testing Library + Playwright (future)
- **Backend Testing**: pytest + FastAPI TestClient + MongoDB test database
- **Coverage Reporting**: 70% minimum coverage requirement
- **CI/CD Integration**: GitHub Actions for automated testing

## Quick Start

### Frontend Tests

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Backend Tests

```bash
# Install dependencies
cd api
pip install -r requirements.txt

# Run tests
pytest

# Run with coverage
pytest --cov=api --cov-report=html

# Run specific test file
pytest tests/test_goals.py
```

## Project Structure

```
├── client/src/
│   ├── components/
│   │   ├── navigation.test.tsx      # Component tests
│   │   └── ...
│   └── test/
│       ├── setup.ts                 # Test setup and mocks
│       └── test-utils.tsx           # Custom test utilities
├── api/
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py              # Shared fixtures
│   │   ├── test_main.py             # App-level tests
│   │   ├── test_goals.py            # Goals API tests
│   │   └── README.md               # Backend testing docs
│   ├── pytest.ini                   # pytest configuration
│   └── requirements.txt             # Test dependencies
├── vitest.config.ts                 # Frontend test config
├── package.json                     # Frontend test scripts
└── .github/workflows/test.yml       # CI/CD configuration
```

## Frontend Testing

### Configuration

- **Framework**: Vitest
- **UI Library**: React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: V8 coverage provider
- **Coverage Threshold**: 70% minimum

### Key Features

- **Global Setup**: `src/test/setup.ts` with common mocks
- **Custom Render**: `src/test/test-utils.tsx` with providers
- **Path Aliases**: `@/` for clean imports
- **Auto-mocking**: Browser APIs (matchMedia, ResizeObserver, etc.)

### Writing Frontend Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/test-utils'
import { useLocation } from 'wouter'
import MyComponent from './MyComponent'

// Mock dependencies
vi.mock('wouter', () => ({
  useLocation: vi.fn(),
  Link: ({ children }) => <a>{children}</a>
}))

describe('MyComponent', () => {
  it('renders correctly', () => {
    ;(useLocation as any).mockReturnValue(['/'])
    render(<MyComponent />)

    expect(screen.getByText('Hello')).toBeTruthy()
  })
})
```

## Backend Testing

### Configuration

- **Framework**: pytest
- **Async Support**: pytest-asyncio
- **Coverage**: pytest-cov
- **Database**: MongoDB test instance
- **Coverage Threshold**: 70% minimum

### Key Features

- **Async Testing**: Full async/await support
- **Database Fixtures**: Isolated test database
- **Mocking**: Comprehensive dependency mocking
- **Markers**: `unit`, `integration`, `api`, `slow`

### Writing Backend Tests

```python
import pytest
from fastapi.testclient import TestClient

def test_create_goal(test_client, test_user, auth_headers, monkeypatch):
    # Mock database operations
    mock_db = AsyncMock()
    monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)

    # Test the endpoint
    response = test_client.post("/api/goals", json=goal_data, headers=auth_headers)

    assert response.status_code == 201
    assert response.json()["success"] is True
```

## Test Categories

### Frontend Tests

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **E2E Tests**: Full user journey testing (future)

### Backend Tests

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing with database
3. **API Tests**: Complete request/response cycle testing

## Coverage Requirements

### Frontend
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

### Backend
- **Overall**: 70%
- **API Module**: 70%

## CI/CD Integration

### GitHub Actions Workflow

The CI/CD pipeline includes:

1. **Frontend Testing**: Multiple Node.js versions
2. **Backend Testing**: Multiple Python versions with MongoDB
3. **Integration Testing**: Full stack testing
4. **Quality Checks**: Linting and coverage validation
5. **Coverage Reporting**: Codecov integration

### Running Locally

```bash
# Run all tests
npm run test        # Frontend
cd api && pytest    # Backend

# Run with coverage
npm run test:coverage
cd api && pytest --cov=api --cov-report=html

# Run CI checks locally
# (Add scripts to package.json as needed)
```

## Best Practices

### General

1. **Test Isolation**: Each test should be independent
2. **Descriptive Names**: Tests should describe behavior
3. **Arrange-Act-Assert**: Clear test structure
4. **Mock External Dependencies**: APIs, databases, etc.
5. **Test Edge Cases**: Error conditions and boundary values

### Frontend Specific

1. **Use Testing Library**: Query by user-visible elements
2. **Avoid Implementation Details**: Test behavior, not internals
3. **Mock Hooks and Context**: Isolate component logic
4. **Test Accessibility**: Use appropriate queries

### Backend Specific

1. **Mock Database Operations**: Use AsyncMock for MongoDB
2. **Test Error Conditions**: HTTP status codes and error messages
3. **Use Fixtures**: Reusable test data and setup
4. **Test Authentication**: Mock auth dependencies

## Common Issues & Solutions

### Frontend

```typescript
// Issue: jest-dom matchers not available
// Solution: Import from test-utils
import { render, screen } from '@/test/test-utils'

// Issue: Path aliases not working
// Solution: Update vitest.config.ts
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
    '@/client': resolve(__dirname, './client/src'),
  },
}
```

### Backend

```python
# Issue: Async test not working
# Solution: Add asyncio marker
@pytest.mark.asyncio
async def test_async_operation():
    pass

# Issue: Database connection issues
# Solution: Use test fixtures
def test_with_db(test_db):
    # test_db is automatically cleaned up
    pass
```

## Contributing

### Adding New Tests

1. **Frontend**: Create `.test.tsx` files alongside components
2. **Backend**: Create `test_*.py` files in `api/tests/`
3. **Follow Conventions**: Use existing patterns and fixtures
4. **Update Documentation**: Add examples to this guide
5. **Coverage**: Ensure new code maintains coverage thresholds

### Test Organization

```
# Frontend
client/src/components/Component/
├── Component.tsx
├── Component.test.tsx
└── index.ts

# Backend
api/tests/
├── test_feature.py
├── test_another_feature.py
└── conftest.py
```

## Future Enhancements

- [ ] **E2E Testing**: Playwright integration
- [ ] **Performance Testing**: Load and stress testing
- [ ] **Visual Regression**: Component screenshot testing
- [ ] **API Contract Testing**: OpenAPI specification validation
- [ ] **Security Testing**: Automated security scans

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [MongoDB Testing](https://docs.mongodb.com/drivers/python/)