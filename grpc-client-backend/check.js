import redis from "./database/redis.js";
import Package from "./models/package.js";
import config from "./config/config.js";
import mongoose from "mongoose";

mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

async function main() {
    const pkgList = await Package.find({}).lean();

    for (const pkg of pkgList) {
        if (
            pkg.coordinates.latitude / 1000000 > 14 ||
            pkg.coordinates.latitude / 1000000 < 11 ||
            pkg.coordinates.longitude / 1000000 > 78 ||
            pkg.coordinates.longitude / 1000000 < 76
        ) {
            console.log(pkg);
        }
    }
}
main();
