# Vercel Deployment Setup

## What was added

- `.github/workflows/vercel-deploy.yml`
- `vercel.json`
- `api/index.ts`

This setup deploys the NestJS API to Vercel as a serverless function.

## Important note about data

This project loads data from `data/staff.json` and `data/loans.json`.
On Vercel, runtime file changes are not persistent across deployments or cold starts.
Because of that, the delete-loan endpoint now deletes only for the current runtime session.

## 1. Create the Vercel project

1. Push this repository to GitHub.
2. Log in to Vercel.
3. Click `Add New...` -> `Project`.
4. Import the GitHub repository.
5. Keep the project as a Node.js project.
6. Complete the import once so Vercel creates the project.

## 2. Add environment variables in Vercel

In the Vercel project settings, add:

- `JWT_SECRET`
- `JWT_EXPIRES_IN`

Suggested values:

- `JWT_SECRET=replace-this-with-a-long-random-secret`
- `JWT_EXPIRES_IN=1h`

## 3. Get Vercel credentials for GitHub Actions

You need these three values:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

### Get `VERCEL_TOKEN`

1. Open Vercel dashboard.
2. Go to `Settings` -> `Tokens`.
3. Create a new token.

### Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`

Run this locally after installing the Vercel CLI:

```bash
npm install -g vercel
vercel login
vercel link
```

Then open:

```bash
.vercel/project.json
```

You will find:

- `orgId`
- `projectId`

## 4. Add GitHub repository secrets

In GitHub:

1. Open the repository.
2. Go to `Settings` -> `Secrets and variables` -> `Actions`.
3. Add these repository secrets:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

## 5. Workflow behavior

- On every pull request to `main`, GitHub Actions runs build/tests and creates a Vercel preview deployment.
- On every push to `main`, GitHub Actions runs build/tests and deploys to Vercel production.
- You can also trigger the workflow manually with `workflow_dispatch`.

## 6. Local commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run start:dev
```

Build locally:

```bash
npm run build
```

## 7. Recommended Vercel project settings

- Framework preset: `Other`
- Root directory: repository root
- Build command: leave empty when using `vercel.json`
- Output directory: leave empty

## 8. Test the deployed API

If your production deployment URL is:

```text
https://your-project.vercel.app
```

Then your endpoints will be:

- `POST /login`
- `POST /logout`
- `GET /loans`
- `GET /loans?status=pending`
- `GET /loans/expired`
- `GET /loans/:userEmail/get`
- `DELETE /loan/:loanId/delete`

Example:

```bash
curl https://your-project.vercel.app/
```
