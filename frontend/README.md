# Propertier Frontend

Frontend application for Propertier, built with React and Vite.

## Folder Structure

The project follows a modular structure for maintainability:

- `src/api` -> API request handlers (Axios instances, endpoints)
- `src/assets` -> Static assets (images, icons, etc.)
- `src/components` -> Reusable UI components
  - `common` -> Global reusable components (buttons, inputs)
  - `layout` -> Components for layout (navbar, footer)
- `src/context` -> React Context API for state management
- `src/hooks` -> Custom React hooks
- `src/layouts` -> Layout wrappers for pages
- `src/pages` -> Route-level components
- `src/routes` -> Routing configuration
- `src/utils` -> Helper functions and constants
- `src/validators` -> Form validation schemas

## Tech Stack

- React 19
- Vite 6
- React Router 7
- Tailwind CSS 4

## Run Locally

From project root:

```bash
cd frontend
npm install
npm run dev
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)
