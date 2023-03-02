import config from "./config/config.js";
import mongoose from "mongoose";
import Package from "./models/package.js";
import Route from "./models/route.js";
import Status from "./models/status.js";

mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

async function connect() {
    try {
        const routes = await Route.find({}).populate("paths").lean();

        for await (const route of routes) {
            let data = 1;
            const paths = route.paths;

            
        }
    } catch (error) {
        console.log(error);
    }
}

connect();
