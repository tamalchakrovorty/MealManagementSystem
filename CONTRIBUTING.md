# Contributing to MMS

Thanks for your interest in contributing! Here's how to get started.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/MealManagementSystem.git`
3. Create a branch: `git checkout -b feature/your-feature`
4. Install dependencies: `npm install`
5. Set up the database (see [README.md](./README.md))
6. Start the dev server: `npm run dev`

## Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow existing patterns and conventions
- Run `npm run lint` before committing
- Keep components focused and reusable

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add meal-off toggle for users
fix: resolve deposit calculation issue
chore: update dependencies
docs: add API documentation
```

### Branch Naming

- `feature/description` — new features
- `fix/description` — bug fixes
- `chore/description` — maintenance tasks

## Pull Requests

1. Ensure your code passes lint (`npm run lint`)
2. Update documentation if needed
3. Fill out the PR template completely
4. Request a review from a maintainer

## Reporting Issues

- Use the GitHub issue templates (bug report or feature request)
- Include steps to reproduce for bugs
- Add screenshots if applicable

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). By participating, you agree to uphold its standards.
