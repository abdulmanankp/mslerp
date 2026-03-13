# Supabase → Google Drive Daily Backup Setup Guide

## What this does
A free GitHub Actions workflow runs **every day at 07:00 PKT (02:00 UTC)**.  
It dumps your entire Supabase Postgres database and uploads it to a  
**MSL-ERP-Backups/** folder in your Google Drive, keeping only the last 7 days.

---

## Step 1 – Get Your Supabase Direct DB URL

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project → **Settings** → **Database**
3. Scroll to **Connection string** → choose **URI** tab
4. Copy the string. It looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
   > ⚠️ Use the **direct** connection (port 5432), NOT the pooler (port 6543).  
   > `pg_dump` does not work through the session pooler.

5. Keep this as your `SUPABASE_DB_URL` secret.

---

## Step 2 – Set Up rclone with Google Drive (on your PC once)

### a) Install rclone
- Windows: download from [https://rclone.org/downloads/](https://rclone.org/downloads/)
  or run: `winget install Rclone.Rclone`

### b) Configure Google Drive remote
Open PowerShell and run:
```powershell
rclone config
```
Follow these prompts:
```
n  → New remote
Name: gdrive
Storage: drive  (pick the Google Drive option, usually #18 or #19)
client_id:      (leave blank, press Enter)
client_secret:  (leave blank, press Enter)
scope: 1        (Full access)
root_folder_id: (leave blank)
service_account: (leave blank)
Auto config: y  → will open browser, sign in with your Google account
Team Drive: n
```
Type `q` to quit config.  

### c) Test it
```powershell
rclone lsd gdrive:
```
You should see your Google Drive folders listed.

### d) Export rclone config as base64 (for GitHub secret)
In PowerShell:
```powershell
$configPath = "$env:APPDATA\rclone\rclone.conf"
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes($configPath)) | Set-Clipboard
```
This copies the base64 string to your clipboard. Save it — you'll paste it in Step 3.

---

## Step 3 – Add GitHub Secrets

Your repo must be on GitHub. Then:

1. Open your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** and add these two:

| Secret name            | Value                                      |
|------------------------|--------------------------------------------|
| `SUPABASE_DB_URL`      | `postgresql://postgres:PASSWORD@db.xxx...` |
| `RCLONE_CONFIG_BASE64` | The base64 string from Step 2d             |

---

## Step 4 – Push the workflow file to GitHub

The workflow file is already created at:
```
.github/workflows/db-backup.yml
```

Push your project to GitHub and the workflow will activate automatically.  
To test immediately without waiting for the schedule:

1. Go to your GitHub repo → **Actions** tab
2. Click **Daily Supabase Backup → Google Drive**
3. Click **Run workflow** → **Run workflow**

---

## Step 5 – Verify in Google Drive

After the workflow completes (~2 min), check your Google Drive.  
You should see a new folder **MSL-ERP-Backups/** with a file named:
```
msl_erp_backup_2026-03-13.dump
```

---

## Restoring a Backup

To restore a `.dump` file back to a Postgres database:

```bash
# Download from Google Drive first, then:
pg_restore \
  --no-acl \
  --no-owner \
  --clean \
  -d "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres" \
  msl_erp_backup_2026-03-13.dump
```

---

## Summary of costs
| Service        | Cost  |
|----------------|-------|
| GitHub Actions | Free (2,000 min/month for public; 500 for private) |
| Google Drive   | Free (15 GB storage, a DB dump is usually < 10 MB) |
| Supabase Free  | Free  |
| **Total**      | **$0/month** |
