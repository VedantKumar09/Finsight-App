import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "src") },
      // Fix: Vite 8.x CJS interop is broken for @mui/icons-material v5.
      // Redirect to the ESM build so default exports resolve correctly.
      {
        find: /^@mui\/icons-material\/(.*)/,
        replacement: "@mui/icons-material/esm/$1",
      },
    ],
  },
});

