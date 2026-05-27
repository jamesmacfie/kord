import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig(({ mode }) => ({
	resolve: { tsconfigPaths: true },
	plugins: [
		mode === "production"
			? cloudflare({ viteEnvironment: { name: "ssr" } })
			: null,
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	].filter(Boolean),
}));

export default config;
