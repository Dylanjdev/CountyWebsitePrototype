# Lee County Website Prototype

React and Vite website for Lee County, Virginia.

## GitHub Pages

The workflow at `.github/workflows/deploy-pages.yml` deploys `main` to:

`https://dylanjdev.github.io/CountyWebsitePrototype/`

The workflow reads these encrypted repository secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

GitHub Pages uses **GitHub Actions** as its publishing source. A push to `main` will install dependencies, build the Vite site with the `/CountyWebsitePrototype/` base path, and deploy it. The workflow also creates a `404.html` fallback so direct links such as `/CountyWebsitePrototype/admin` continue to load the React application.
