/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        environment: "happy-dom",
        testTimeout: 10000,
        reporters: "tap-flat"
    },
})
