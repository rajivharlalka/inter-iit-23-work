import mongoose from "mongoose";
import Package from "../models/package.js";
import config from "../config/config.js";

mongoose.set("strictQuery", false);

(async function main() {
    await mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
        console.log("Mongoose connected");
    });
    const pkg = await Package.find({}, "_id");

    for await (const id of pkg) {
        await Package.findByIdAndUpdate(id, {
            dimensions: {
                length: Math.floor(Math.random() * 37) + 3,
                breadth: Math.floor(Math.random() * 37) + 3,
                height: 10,
                weight: Math.floor(Math.random() * 29) + 1,
            },
        });
    }

    await mongoose.disconnect();
})();
