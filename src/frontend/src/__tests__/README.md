# Frontend Testing Guide

Complete guide to testing the Mario Kart style multiplayer racing game frontend.

## 🧰 Testing Stack

### Core Tools

- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - React component testing utilities  
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom DOM matchers
- **Happy-DOM** - Fast DOM implementation for tests

### Coverage

- **@vitest/coverage-v8** - V8 code coverage provider
- Target: 70%+ coverage for utils, services, stores, components

## 📁 Test Structure

```
src/
├─ __tests__/               # Test infrastructure
│  ├─ setup.ts              # Global test setup
│  ├─ mocks/               # Shared mocks
│  │  ├─ axios.mock.ts      # Mock Axios HTTP client
│  │  ├─ signalr.mock.ts    # Mock SignalR connections
│  │  └─ phaser.mock.ts     # Mock Phaser game engine
│  └─ utils/               # Test utilities
│     ├─ test-utils.tsx     # Custom render with providers
│     └─ factories.ts       # Test data factories
└─ [feature]/
   ├─ Component.tsx
   └─ Component.test.tsx    # Co-located tests
```

## 🚀 Running Tests

### Commands

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- constants.test.ts

# Run tests matching pattern
npm test -- --grep "API"
```

### Watch Mode

Vitest runs in watch mode by default during development:
- Tests re-run automatically when files change
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

## 📝 Writing Tests

### Test File Naming

- Unit tests: `*.test.ts` or `*.test.tsx`
- Co-locate tests with source files
- Mirror source directory structure

### Test Structure (AAA Pattern)

```typescript
import { describe, it, expect } from 'vitest';

describe('Feature Name', () => {
  it('should do something specific', () => {
    // Arrange - Set up test data
    const input = 'test';
    
    // Act - Execute the code
    const result = myFunction(input);
    
    // Assert - Verify the outcome
    expect(result).toBe('expected');
  });
});
```

### Component Testing

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/__tests__/utils/test-utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### API Service Testing

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { myApi } from './myApi';

vi.mock('axios');

describe('My API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch data', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.mocked(axios.get).mockResolvedValue({ data: mockData });
    
    const result = await myApi.getData();
    
    expect(axios.get).toHaveBeenCalledWith('/api/data');
    expect(result).toEqual(mockData);
  });
});
```

### Zustand Store Testing

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMyStore } from './myStore';

describe('My Store', () => {
  beforeEach(() => {
    useMyStore.setState({ value: 0 });
  });

  it('should update state', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.setValue(42);
    });
    
    expect(result.current.value).toBe(42);
  });
});
```

## 🎭 Mocking

### Using Test Factories

```typescript
import { createMockUser, createMockPlayer } from '@/__tests__/utils/factories';

const user = createMockUser({ username: 'custom' });
const player = createMockPlayer({ currentElo: 1500 });
```

### Mocking SignalR

```typescript
import { createMockHubConnection } from '@/__tests__/mocks/signalr.mock';

const mockHub = createMockHubConnection();
mockHub.on('PlayerMoved', (data) => {
  // Handle event
});
```

### Mocking Axios

```typescript
import { vi } from 'vitest';
import axios from 'axios';

vi.mock('axios');

vi.mocked(axios.get).mockResolvedValue({ data: 'response' });
```

### Mocking Phaser

```typescript
import { createMockPhaserGame } from '@/__tests__/mocks/phaser.mock';

const mockGame = createMockPhaserGame();
```

## ✅ Best Practices

### DO

1. **Test behavior, not implementation**
   ```typescript
   // Good - tests user-facing behavior
   expect(screen.getByRole('button')).toBeDisabled();
   
   // Bad - tests implementation details
   expect(component.state.disabled).toBe(true);
   ```

2. **Use descriptive test names**
   ```typescript
   // Good
   it('should display error message when email is invalid', () => {});
   
   // Bad
   it('test1', () => {});
   ```

3. **Keep tests isolated**
   - Each test should run independently
   - Clean up after each test
   - Don't rely on test execution order

4. **Mock external dependencies**
   - API calls
   - SignalR connections
   - Phaser game engine
   - Browser APIs

5. **Test edge cases**
   - Empty states
   - Error states
   - Loading states
   - Boundary conditions

### DON'T

1. Don't test library code (React, Zustand, Phaser)
2. Don't test multiple things in one test
3. Don't skip test cleanup
4. Don't forget to test error scenarios
5. Don't use implementation details in assertions

## 📊 Coverage Goals

| Component | Target | Priority |
|-----------|--------|----------|
| Utils | 90%+ | High |
| API Services | 85%+ | High |
| Stores | 90%+ | High |
| Components | 70%+ | Medium |
| Custom Hooks | 80%+ | Medium |
| Game Engine | 50%+ | Low |

### Viewing Coverage

```bash
npm run test:coverage
```

Coverage reports are generated in:
- `coverage/index.html` - HTML report (open in browser)
- `coverage/coverage-final.json` - JSON report
- `coverage/lcov.info` - LCOV format (for CI tools)

## 🔍 Debugging Tests

### Using console.log

```typescript
import { screen } from '@testing-library/react';

// Print the current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Using Vitest UI

```bash
npm run test:ui
```

Opens interactive UI in browser with:
- Test results visualization
- Code coverage visualization
- Console output
- Test file explorer

### VS Code Integration

Install **Vitest extension** for:
- Run tests from editor
- See test results inline
- Debug tests with breakpoints
- Code coverage gutters

## 🎯 Common Patterns

### Testing Async Code

```typescript
it('should load data asynchronously', async () => {
  render(<MyComponent />);
  
  // Wait for element to appear
  const element = await screen.findByText('Loaded');
  expect(element).toBeInTheDocument();
  
  // Or use waitFor
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing Forms

```typescript
it('should submit form with valid data', async () => {
  const onSubmit = vi.fn();
  const user = userEvent.setup();
  
  render(<LoginForm onSubmit={onSubmit} />);
  
  await user.type(screen.getByLabelText(/email/i), 'test@test.com');
  await user.type(screen.getByLabelText(/password/i), 'password');
  await user.click(screen.getByRole('button', { name: /login/i }));
  
  expect(onSubmit).toHaveBeenCalledWith({
    email: 'test@test.com',
    password: 'password'
  });
});
```

### Testing Navigation

```typescript
import { renderWithRouter } from '@/__tests__/utils/test-utils';

it('should navigate to profile page', async () => {
  const user = userEvent.setup();
  
  renderWithRouter(<App />, { initialRoute: '/' });
  
  await user.click(screen.getByText(/profile/i));
  
  expect(screen.getByText(/Profile Page/i)).toBeInTheDocument();
});
```

### Testing Loading States

```typescript
it('should show loading spinner', () => {
  render(<MyComponent isLoading={true} />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

it('should hide loading spinner when loaded', () => {
  const { rerender } = render(<MyComponent isLoading={true} />);
  
  rerender(<MyComponent isLoading={false} />);
  
  expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
});
```

### Testing Error States

```typescript
it('should display error message', () => {
  render(<MyComponent error="Something went wrong" />);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

## 🚨 CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run tests
  run: npm run test:run

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

### Coverage Thresholds

Tests fail if coverage drops below:
- Lines: 70%
- Functions: 70%
- Branches: 70%
- Statements: 70%

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)

## 🎓 Examples

Check existing test files for examples:
- `src/utils/constants.test.ts` - Testing constants and configuration
- `src/types/index.test.ts` - Testing TypeScript types
- `src/__tests__/utils/factories.ts` - Test data factories
- `src/__tests__/mocks/` - Mocking external dependencies

## 💡 Tips

1. Write tests as you develop, not after
2. Start with the simplest test cases
3. Use test.only() to focus on one test during development
4. Use test.skip() to temporarily disable failing tests
5. Keep tests simple and readable
6. Don't over-mock - use real implementations when possible
7. Test user workflows, not individual functions
8. Refactor tests when refactoring code

---

**Happy Testing! 🧪**

For questions or issues, check the project documentation or ask the team.
