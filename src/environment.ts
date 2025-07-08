// Environment variable validation for TBB-Ultimate plugin
// Add required or optional environment variables here as needed

/**
 * Validates and exports environment configuration for the plugin.
 * Add required variables to the config object and validation logic as needed.
 */
export const config = {
  // Example:
  // API_KEY: process.env.TBB_API_KEY || '',
};

export function validateEnvironment() {
  // Example validation:
  // if (!config.API_KEY) throw new Error('TBB_API_KEY is required!');
}
