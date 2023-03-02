import mongoose from "mongoose";
import Package from "../models/package.js";
import config from "../config/config.js";
import Rider from "../models/rider.js";
import Route from "../models/route.js";

mongoose.set("strictQuery", false);

let group = [];

(async function main() {
    await mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
        console.log("Mongoose connected");
    });
    const riders = await Rider.find({}, "_id").lean();
    const packages = await Package.find({}, "_id").lean();
    let j = 0,
        k = 0;
    for await (const pkg of packages) {
        if (j >= 5) {
            const route = await Route.create({rider_id: riders[k++]._id, paths: group});
            console.log(route);
            group = [];
            j = 0;
        }
        j++;
        group.push(pkg._id);
    }

    await mongoose.disconnect();
})();
