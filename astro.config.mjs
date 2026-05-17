// @ts-check
import { defineConfig } from 'astro/config';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_PAGES === 'true';
const isUserOrOrgPagesRepo = repositoryName?.endsWith('.github.io');
const fallbackSite = isGitHubPagesBuild ? `https://${process.env.GITHUB_REPOSITORY_OWNER}.github.io` : undefined;
const fallbackBase = isGitHubPagesBuild && repositoryName && !isUserOrOrgPagesRepo ? `/${repositoryName}` : undefined;

// https://astro.build/config
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || fallbackSite,
  base: process.env.ASTRO_BASE_PATH || fallbackBase,
});
