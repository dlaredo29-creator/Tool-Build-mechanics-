# Reusable Studio Engine

A reusable creative-coding starter template for quickly building, testing, documenting, and deploying new interactive Canvas projects.

## How to Run Locally

You can run the engine locally by opening `index.html` in a web browser.

Because the project uses JavaScript modules, using a simple local server is recommended.

If you are using VS Code, you can use the Live Server extension and click **Go Live**.

The Canvas should appear immediately, and moving the mouse should change the size of the ring.

## How to Deploy

I chose **GitHub Pages** to deploy this project.

To deploy:

1. Push the project to GitHub.
2. Open the repository's **Settings**.
3. Go to **Pages**.
4. Set the source to **Deploy from a branch**.
5. Select the `main` branch.
6. Select `/ (root)`.
7. Click **Save**.

GitHub Pages then creates a public link to the project.

Every time I push new changes to the `main` branch, the live version updates automatically.

## How I Use This to Start Projects

When I start a new project, I first define what I want the system to mean before writing code.

My personal ritual is:

1. Write the intent and constraints in `SYSTEM_CHARTER.md`.
2. Define the signal, parameter, behavior, and readability test.
3. Sketch the system in words before coding.
4. Build the smallest working version.
5. Test the behavior in the browser.
6. Record important changes in `process/changelog.md`.
7. Take screenshots of major milestones.
8. Polish only after the main idea is readable.
9. Update the README.
10. Push the project to GitHub and test the deployed link.

The goal is to have a clear creative direction before using AI or adding technical complexity.