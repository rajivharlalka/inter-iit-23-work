import Route from "./models/route.js";
import redis from "./database/redis.js";
import config from "./config/config.js";
import Package from "./models/package.js";
import mongoose from "mongoose";
import axios from "axios";
import pkg from "@googlemaps/polyline-codec";
const {decode} = pkg;
import Status from "./models/status.js";

mongoose.set("strictQuery", false);
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

const paths = {};
const SCALE = 1000000;

const API_KEY = config.googleApiKey;

const create_distance_config = (lat1, lng1, lat2, lng2) => {
    var config = {
        method: "get",
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${lat1},${lng1}&destination=${lat2},${lng2}&key=${API_KEY}`,
        headers: {},
    };
    return config;
};

const deliverPackage = async package_id => {
    // await Package.findOneAndUpdate({id: package_id}, {latest_status: "DELIVERED"});
    // await Status.create({package_id: package_id, status: "DELIVERED"});

    console.log("Delivered package", package_id);
};

async function main() {
    console.log("Hello World");
    const check = (await redis.checkScript()) === "true" ? true : true;
    const warehouse = JSON.parse(await redis.getWarehouse());
    const old_warehouse = {latitude: warehouse.latitude, longitude: warehouse.longitude, address: warehouse.address};
    warehouse.latitude = warehouse.latitude / SCALE;
    warehouse.longitude = warehouse.longitude / SCALE;

    console.log(check);
    if (check) {
        let routes = await Route.find({}).populate("paths").lean();

        console.log(routes.length);

        for await (const route of routes) {
            console.log(JSON.stringify(route.rider_id));
            let rider_location = JSON.parse(await redis.getRiderData(JSON.stringify(route.rider_id)));
            if (!rider_location) rider_location = warehouse;

            let rider_time_remaining = JSON.parse(await redis.rider_time_remaining(JSON.stringify(route.rider_id)));
            if (!rider_time_remaining) rider_time_remaining = 0;

            let rider_moved = JSON.parse(await redis.getRiderMoved(JSON.stringify(route.rider_id)));
            if (!rider_moved) rider_moved = 0;

            let remaining = 600 + rider_time_remaining;
            for (const cooridnate of route.paths) {
                console.log(cooridnate.coordinates);
            }

            while (remaining > 0) {
                if (rider_moved >= route.paths.length) break;

                const distance_config = create_distance_config(
                    rider_location.latitude,
                    rider_location.longitude,
                    route.paths[rider_moved].coordinates.latitude / SCALE,
                    route.paths[rider_moved].coordinates.longitude / SCALE
                );

                let distance_data = (await axios(distance_config)).data;

                console.log(distance_data.routes[0].legs);

                let duration = distance_data.routes[0].legs[0].duration.value;

                console.log(duration);
                console.log(rider_location, remaining);
                remaining -= duration;

                rider_location = {
                    latitude: route.paths[rider_moved].coordinates.latitude / SCALE,
                    longitude: route.paths[rider_moved].coordinates.longitude / SCALE,
                };
                console.log(rider_location, remaining);

                await deliverPackage(route.paths[rider_moved]._id);

                await redis.setRiderData(rider_location, JSON.stringify(route.rider_id));

                rider_moved += 1;
            }
            await redis.setRiderMoved(rider_moved, JSON.stringify(route.rider_id));
            await redis.setRiderRem(Math.abs(remaining), JSON.stringify(route.rider_id));
        }
    }
}

main();
