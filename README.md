# One More Thing

One More Thing is a beginner-friendly React + Vite productivity app. It helps you pick one small extra task, mark it complete, and build a simple daily streak.

## What is included

- Mobile-first React interface
- Built-in task suggestions
- Random "Give me one more thing" button
- Complete and Skip actions
- Custom task form
- Categories: Home, Work, Health, Money, Family, Quick Win
- Saved custom tasks in `localStorage`
- Saved completed task history in `localStorage`
- Today's completed count and current streak
- Tailwind CSS styling

## Run locally

1. Install Node.js from [nodejs.org](https://nodejs.org/) if you do not already have it.
2. Open this folder in your terminal.
3. Install the app packages:

```bash
npm install
```

4. Start the local app:

```bash
npm run dev
```

5. Open the local URL shown in the terminal. It is usually:

```text
http://localhost:5173
```

## Project files

- `src/App.jsx` contains the app screen and most of the app logic.
- `src/main.jsx` starts React.
- `src/styles.css` loads Tailwind CSS.
- `tailwind.config.js` tells Tailwind where to find the app files.
- `package.json` lists scripts and dependencies.
