import path from "path";
const __dirname = path.resolve();

import dotenv from "dotenv";
dotenv.config({path: path.join(__dirname, "/.env")});

const envVars = process.env;
export default {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    mongoose: {
        url: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
    },
    auth: {
        admin: {
            email: "yo@admin.com",
            password: "Admin098",
        },
        rider: {
            password: "Rider098",
        },
    },
    redis: envVars.REDIS_URL,
    googleApiKey: envVars.GOOGLE_API_KEY,
    scalingFactor: 1e6,
    rabbitmq: envVars.RABBITMQ,
    awsKeys: {
        accessKeyId: envVars.AWS_ACCESS_KEY_ID,
        secretAccessKey: envVars.AWS_SECRET_KEY,
    },
    privateBucket: envVars.PUBLIC_BUCKET,
};
