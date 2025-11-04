import cors from "cors";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const dotenv = require("dotenv").config();

// const apiUrls = process.env.API_URLS.split(",");
// const ACCEPTED_ORIGINS = apiUrls;

export const corsMiddleware = () =>
    cors({
        // origin: (origin, callback) => {
        //      if (acceptedOrigins.includes(origin)) {
        //           return callback(null, true);
        //      }
        //      if (!origin) {
        //           return callback(null, true);
        //      }
        //      return callback(new Error('No esta permitido por CORS'));
        // },
        origin: "*",
    });
