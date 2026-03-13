# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Use Visual Studio Code (VSCode)**

VSCode has built-in Git support, making it easy to edit code, commit, and push changes directly from the editor.

Prerequisites:
- [Visual Studio Code](https://code.visualstudio.com/) installed
- [Git](https://git-scm.com/downloads) installed
- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

1. **Clone the repository into VSCode**
   - Open VSCode.
   - Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac) to open the Command Palette.
   - Type `Git: Clone` and select it.
   - Paste the repository URL and choose a local folder to clone into.
   - When prompted, click **Open** to open the cloned project in VSCode.

2. **Install dependencies and start the dev server**

   Open the integrated terminal (`` Ctrl+` `` or `View > Terminal`) and run:

   ```sh
   npm install
   npm run dev
   ```

3. **Make your code changes**

   Edit any files in the `src/` folder using the VSCode editor. The dev server will hot-reload your changes automatically.

4. **Stage and commit your changes**
   - Click the **Source Control** icon in the left sidebar (or press `Ctrl+Shift+G`).
   - You will see a list of changed files under **Changes**.
   - Hover over a file and click the **+** icon to stage it, or click the **+** next to **Changes** to stage all files.
   - Type a commit message in the input box at the top (e.g., `feat: add new feature`).
   - Press `Ctrl+Enter` or click the **✓ Commit** button to commit.

5. **Push your changes to GitHub**
   - After committing, click the **⋯ More actions** menu (three dots) in the Source Control panel and select **Push**, or click the **Sync Changes** button that appears.
   - Alternatively, open the terminal and run:

   ```sh
   git push
   ```

   Your changes will now appear on GitHub and be reflected in the Lovable project.

> **Tip:** Install the [GitLens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) VSCode extension for enhanced Git history, blame annotations, and branch management directly inside the editor.

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
