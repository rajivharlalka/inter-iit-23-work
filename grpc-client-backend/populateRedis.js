import redis from "./database/redis.js";
import Package from "./models/package.js";
import config from "./config/config.js";
import mongoose from "mongoose";

mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

const pkgList = await Package.find({}).lean();

async function main() {
    let promises = [];

    await Promise.all(
        pkgList.map(async pkg => {
            const {coordinates} = pkg;
            const redisCoordinates = {
                latitude: coordinates.latitude / parseFloat(config.scalingFactor),
                longitude: coordinates.longitude / parseFloat(config.scalingFactor),
            };
            console.log(redisCoordinates);
            await redis.addGeoData(redisCoordinates, pkg._id.toString());
        })
    );
}

main();
