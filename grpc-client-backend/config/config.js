import path from "path";
const __dirname = path.resolve();

import dotenv from "dotenv";
dotenv.config({path: path.join(__dirname, "/.env")});

const envVars = process.env;
export default {
    mongoose: {
        url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    redis: envVars.REDIS_URL,
    googleApiKey: envVars.GOOGLE_API_KEY,
    scalingFactor: 1e6,
    rabbitmq: envVars.RABBITMQ,
    optimizerServer: envVars.OPTIMISER_SERVER,
    dynamicServer: envVars.DYNAMIC_SERVER,
};
