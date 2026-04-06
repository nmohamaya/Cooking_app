# GitHub Projects Board Setup

Create a GitHub Project board for agent work coordination.

## Setup Steps

1. Go to https://github.com/nmohamaya/Cooking_app/projects
2. Click "New project" → "Board" template
3. Name: "MyRecipeApp Agent Board"

## Columns

Create these columns (drag to reorder):

| Column | Purpose | Who uses it |
|--------|---------|-------------|
| **Backlog - Backend** | Backend issues waiting for assignment | backend-dev agent |
| **Backlog - Frontend** | Frontend issues waiting for assignment | frontend-dev agent |
| **Backlog - Infra** | CI/CD, deployment, build issues | devops agent |
| **In Progress** | Currently being worked on by an agent | All agents |
| **In Review** | PR open, waiting for review | reviewer / reviewer-quick |
| **QA** | Needs test coverage or manual testing | qa-engineer agent |
| **Done** | Merged and closed | Auto-move on PR merge |

## Automation Rules

Set up these automations (Project settings > Workflows):

- **Item added to project** → Set status to appropriate backlog based on label
- **Pull request merged** → Move to "Done"
- **Pull request opened** → Move to "In Review"

## CLI Setup (optional)

To manage the board from CLI:
```bash
# Requires additional scopes
gh auth refresh -s project,read:project

# Then:
gh project list --owner nmohamaya
gh project item-add <PROJECT_NUMBER> --owner nmohamaya --url <ISSUE_URL>
```
