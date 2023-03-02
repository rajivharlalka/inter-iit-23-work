import mongoose from "mongoose";
import Package from "../models/package.js";
import config from "../config/config.js";
import Rider from "../models/rider.js";
import Route from "../models/route.js";
import fs from "fs";

mongoose.set("strictQuery", false);

function writeDataToFile(data) {
    fs.appendFileSync(
        "./tmp/coordinates.txt",
        JSON.stringify(data.latitude / 1000000) + " " + JSON.stringify(data.longitude / 1000000) + "\n"
    );
}

(async function main() {
    await mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
        console.log("Mongoose connected");
    });
    // const pkg = await Package.find({}, "_id");
    const rider = await Route.findOne({rider_id: "63d1295758fa89399775d87d"}).populate("paths").lean();
    console.log(rider.paths);

    for (const id of rider.paths) {
        console.log(id);
        writeDataToFile(id.coordinates);
    }

    await mongoose.disconnect();
})();
