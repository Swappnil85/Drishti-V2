# Contributing to Drishti

## Welcome Contributors! 🎉

Thank you for your interest in contributing to Drishti! This guide will help you get started with contributing to our AI-powered visual assistance application.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- **Be respectful**: Treat everyone with respect and kindness
- **Be inclusive**: Welcome people of all backgrounds and experience levels
- **Be collaborative**: Work together to build something amazing
- **Be constructive**: Provide helpful feedback and suggestions
- **Be patient**: Remember that everyone is learning

## Getting Started

### 1. Fork and Clone
```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/Drishti.git
cd Drishti

# Add upstream remote
git remote add upstream https://github.com/Swappnil85/Drishti.git
```

### 2. Set Up Development Environment
Follow the [Getting Started Guide](./GETTING_STARTED.md) to set up your local development environment.

### 3. Create a Branch
```bash
# Sync with upstream
git checkout develop
git pull upstream develop

# Create feature branch
git checkout -b feature/your-feature-name
```

## Types of Contributions

### 🐛 Bug Reports
Found a bug? Help us fix it!

**Before submitting:**
- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant information (OS, browser, steps to reproduce)

**Bug Report Template:**
```markdown
**Bug Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen.

**Actual Behavior**
What actually happens.

**Environment**
- OS: [e.g., macOS 12.0]
- Browser: [e.g., Chrome 95]
- App Version: [e.g., 1.0.0]

**Screenshots**
If applicable, add screenshots.
```

### 💡 Feature Requests
Have an idea for a new feature?

**Feature Request Template:**
```markdown
**Feature Description**
A clear description of the feature.

**Problem Statement**
What problem does this solve?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

### 🔧 Code Contributions

#### Small Changes
- Typo fixes
- Documentation improvements
- Small bug fixes

#### Large Changes
- New features
- Major refactoring
- Breaking changes

**For large changes, please:**
1. Open an issue first to discuss
2. Get approval from maintainers
3. Break into smaller PRs when possible

## Development Guidelines

### Branch Naming
```bash
# Features
feature/user-authentication
feature/camera-integration

# Bug fixes
fix/login-validation-error
fix/camera-permission-crash

# Documentation
docs/api-documentation
docs/setup-guide

# Refactoring
refactor/user-service-cleanup
refactor/component-structure
```

### Commit Messages
Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format
<type>[optional scope]: <description>

# Examples
feat(auth): add JWT token refresh
fix(camera): resolve permission request crash
docs(api): update endpoint documentation
test(user): add user service unit tests
refactor(mobile): restructure component hierarchy
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `style`: Code style changes
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### Code Quality

#### Before Submitting
```bash
# Run all checks
npm run lint          # ESLint
npm run format        # Prettier
npm run type-check    # TypeScript
npm run test          # All tests
npm run build         # Build check
```

#### Code Review Checklist
- [ ] Code follows project standards
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] No console.log statements
- [ ] Error handling is implemented
- [ ] Accessibility considerations
- [ ] Performance implications considered

## Pull Request Process

### 1. Prepare Your PR
```bash
# Ensure your branch is up to date
git checkout develop
git pull upstream develop
git checkout feature/your-feature-name
git rebase develop

# Run final checks
npm run lint
npm run test
npm run build
```

### 2. Create Pull Request
**PR Title Format:**
```
<type>: <description>

Examples:
feat: add user profile management
fix: resolve camera permission issue
docs: update API documentation
```

**PR Description Template:**
```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
```

### 3. Review Process
1. **Automated Checks**: CI/CD pipeline runs
2. **Code Review**: Maintainers review code
3. **Feedback**: Address review comments
4. **Approval**: Get approval from maintainers
5. **Merge**: Maintainer merges PR

## Testing Guidelines

### Writing Tests
```typescript
// Unit test example
describe('UserService', () => {
  test('should create user with valid data', async () => {
    // Arrange
    const userData = { email: 'test@example.com', name: 'Test' };
    
    // Act
    const user = await userService.create(userData);
    
    // Assert
    expect(user.email).toBe(userData.email);
  });
});

// Component test example
describe('Button Component', () => {
  test('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = render(
      <Button title="Test" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Test Coverage
- Aim for >80% code coverage
- Focus on critical business logic
- Test error scenarios
- Include edge cases

## Documentation

### Code Documentation
```typescript
/**
 * Analyzes image using AI services
 * @param imageUrl - URL of image to analyze
 * @param options - Analysis configuration
 * @returns Analysis results with confidence scores
 * @throws {ApiError} When image is invalid or service fails
 */
const analyzeImage = async (
  imageUrl: string,
  options: AnalysisOptions
): Promise<VisualAnalysis> => {
  // Implementation
};
```

### README Updates
- Keep README.md current
- Update setup instructions
- Add new feature documentation
- Include troubleshooting tips

## Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code review and collaboration

### Getting Help
- Check existing documentation
- Search GitHub issues
- Ask in GitHub Discussions
- Tag maintainers for urgent issues

## Recognition

### Contributors
All contributors are recognized in:
- GitHub contributors list
- Release notes
- Project documentation

### Maintainer Path
Active contributors may be invited to become maintainers:
- Consistent quality contributions
- Helpful code reviews
- Community engagement
- Technical expertise

## Release Process

### Versioning
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule
- **Patch releases**: As needed for critical fixes
- **Minor releases**: Monthly feature releases
- **Major releases**: Quarterly with breaking changes

## Legal

### License
By contributing, you agree that your contributions will be licensed under the MIT License.

### Copyright
- You retain copyright of your contributions
- You grant the project a perpetual license to use your contributions
- Ensure you have rights to contribute any third-party code

## Thank You! 🙏

Your contributions make Drishti better for everyone. Whether you're fixing a typo, reporting a bug, or adding a major feature, every contribution is valuable and appreciated.

Happy coding! 🚀
