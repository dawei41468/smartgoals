# SmartGoals API Testing

This directory contains comprehensive tests for the SmartGoals API backend.

## Test Structure

```
tests/
├── __init__.py              # Test package initialization
├── conftest.py              # Shared fixtures and configuration
├── test_main.py             # Tests for main FastAPI application
├── test_goals.py            # Tests for goals API endpoints
└── README.md               # This file
```

## Running Tests

### Prerequisites

1. Install test dependencies:
```bash
cd api
pip install -r requirements.txt
```

2. Set up environment variables for testing:
```bash
export MONGODB_URI="your_test_mongodb_uri"
export MONGODB_DB="smartgoals_test"
export JWT_SECRET="test_jwt_secret"
```

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=api --cov-report=html

# Run specific test file
pytest test_goals.py

# Run tests with specific markers
pytest -m "unit"
pytest -m "integration"

# Run tests in verbose mode
pytest -v

# Run tests and stop on first failure
pytest -x
```

## Test Configuration

The test configuration is defined in `pytest.ini`:

- **Test discovery**: Files matching `test_*.py` patterns
- **Coverage**: Minimum 70% coverage required
- **Markers**: `unit`, `integration`, `slow`, `api` for categorizing tests
- **Async support**: Automatic handling of async tests

## Fixtures

### Shared Fixtures (conftest.py)

- `test_client`: FastAPI TestClient instance
- `test_db`: Test MongoDB database connection
- `test_user`: Mock user data
- `test_goal`: Mock goal data
- `auth_headers`: Authentication headers for tests
- `event_loop`: Async event loop for tests

### Using Fixtures

```python
def test_example(test_client, test_user, auth_headers):
    # Use fixtures in your tests
    response = test_client.get("/api/goals", headers=auth_headers)
    assert response.status_code == 200
```

## Writing Tests

### Test Categories

1. **Unit Tests**: Test individual functions and methods
2. **Integration Tests**: Test API endpoints with database interactions
3. **API Tests**: Test complete request/response cycles

### Example Test Structure

```python
import pytest
from fastapi.testclient import TestClient

class TestGoalsAPI:
    """Test cases for Goals API endpoints."""

    def test_create_goal_success(self, test_client, test_user, auth_headers, monkeypatch):
        """Test successful goal creation."""
        # Mock dependencies
        # Make request
        # Assert response
        pass

    @pytest.mark.asyncio
    async def test_async_operation(self, test_db):
        """Test async database operations."""
        # Test async operations
        pass
```

### Mocking Dependencies

Use `monkeypatch` to mock dependencies:

```python
def test_example(monkeypatch):
    # Mock database operations
    mock_db = AsyncMock()
    monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)

    # Mock authentication
    monkeypatch.setattr("api.routers.goals.get_current_user", lambda: test_user)
```

## Coverage

Coverage reports are generated in multiple formats:

- **Terminal**: `pytest --cov=api`
- **HTML**: `pytest --cov=api --cov-report=html` (opens `htmlcov/index.html`)
- **XML**: `pytest --cov=api --cov-report=xml` (for CI/CD integration)

### Coverage Requirements

- **Global coverage**: 70% minimum
- **Source**: `api/` directory
- **Exclusions**: Test files and configuration files

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Mock External Dependencies**: Database, external APIs, etc.
3. **Use Fixtures**: For reusable test data and setup
4. **Descriptive Names**: Test methods should describe what they test
5. **Arrange-Act-Assert**: Structure tests clearly
6. **Test Edge Cases**: Error conditions, boundary values
7. **Keep Tests Fast**: Avoid slow operations in unit tests

## Common Patterns

### Testing API Endpoints

```python
def test_get_goal(test_client, test_user, auth_headers, monkeypatch):
    # Arrange
    mock_db = AsyncMock()
    monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)

    # Act
    response = test_client.get("/api/goals/goal1", headers=auth_headers)

    # Assert
    assert response.status_code == 200
    assert response.json()["success"] is True
```

### Testing Error Conditions

```python
def test_goal_not_found(test_client, auth_headers, monkeypatch):
    # Mock database to return None
    mock_db = AsyncMock()
    mock_goals_collection = AsyncMock()
    mock_goals_collection.find_one.return_value = None
    mock_db.__getitem__.return_value = mock_goals_collection

    monkeypatch.setattr("api.routers.goals.get_db", lambda: mock_db)

    response = test_client.get("/api/goals/nonexistent", headers=auth_headers)

    assert response.status_code == 404
```

## Troubleshooting

### Common Issues

1. **Import Errors**: Ensure all dependencies are installed
2. **Database Connection**: Check MongoDB connection settings
3. **Async Test Issues**: Use `@pytest.mark.asyncio` for async tests
4. **Fixture Errors**: Ensure fixtures are properly defined in conftest.py

### Debug Mode

Run tests with detailed output:

```bash
pytest -v -s --tb=long
```

### Skipping Tests

```python
@pytest.mark.skip(reason="Database not available")
def test_database_operation():
    pass

@pytest.mark.skipif(not os.getenv("MONGODB_URI"), reason="MongoDB not configured")
def test_mongo_operation():
    pass
```

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Add appropriate markers (`@pytest.mark.unit`, `@pytest.mark.integration`)
3. Include docstrings describing what each test does
4. Ensure tests are isolated and don't depend on external state
5. Update this README if you add new test categories or patterns