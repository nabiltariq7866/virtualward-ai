import { defineConfig, devices } from '@playwright/test'
export default defineConfig({testDir:'./e2e',fullyParallel:false,workers:1,retries:0,timeout:60000,reporter:'list',use:{baseURL:'http://127.0.0.1:4173',trace:'off',screenshot:'off'},projects:[{name:'chromium',use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}}]})
