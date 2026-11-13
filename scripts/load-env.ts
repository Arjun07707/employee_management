import { config } from "dotenv";

// `.env.local` wins over `.env` in development.
config({ path: ".env.local", quiet: true });
config({ quiet: true });
