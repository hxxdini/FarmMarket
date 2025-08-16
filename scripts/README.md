# Development Scripts

## Hourly Commit Script

The `hourly-commit.sh` script helps maintain regular git commits without overwhelming the git history.

### Usage

```bash
# Run manually when you want to commit accumulated changes
./scripts/hourly-commit.sh

# Or set up a cron job for automatic hourly commits
# Add this to your crontab (crontab -e):
# 0 * * * * cd /path/to/your/project && ./scripts/hourly-commit.sh
```

### Benefits

- ✅ Regular checkpoints for development progress
- ✅ Cleaner git history with meaningful commits
- ✅ Automatic backup of work in progress
- ✅ Easy to revert to recent working state

### Manual Commits

For important features or bug fixes, you can still make manual commits:

```bash
git add .
git commit -m "feat: add new market price validation"
```

The hourly script will only commit if there are uncommitted changes.
