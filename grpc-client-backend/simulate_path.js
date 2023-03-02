import redis from "./database/redis.js";
import Routes from "./models/route.js";
import config from "./config/config.js";
import Package from "./models/package.js";
import mongoose from "mongoose";
import Status from "./models/status.js";

const factor = 1000000;

mongoose.set("strictQuery", false);
mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

Number.prototype.toRad = function () {
    return (this * Math.PI) / 180;
};

//fucntion that calculates haversine distance between two coordinates in metres
const haversineDistance = (riderCoordinates, pkgCoordinates) => {
    const lat1 = riderCoordinates.latitude;
    const lon1 = riderCoordinates.longitude;

    const lat2 = pkgCoordinates.latitude;
    const lon2 = pkgCoordinates.longitude;

    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d;
};

async function getRiders() {
    let data = {};
    let warehouse = JSON.parse(await redis.getWarehouse());
    console.log(warehouse);
    const old_warehouse = {latitude: warehouse.latitude, longitude: warehouse.longitude, address: warehouse.address};
    warehouse.latitude = warehouse.latitude / factor;
    warehouse.longitude = warehouse.longitude / factor;
    const routes = await Routes.find({}).populate("paths");
    let last_path = warehouse;
    let last_distance = 0;
    for await (const route of routes) {
        data[route.rider_id] = [];
        route.paths.push({coordinates: old_warehouse});
        // console.log(route.paths);
        for await (const path of route.paths) {
            path.coordinates.latitude = path.coordinates.latitude / factor;
            path.coordinates.longitude = path.coordinates.longitude / factor;

            const distance = haversineDistance(path.coordinates, last_path);
            data[route.rider_id].push({
                lat: path.coordinates.latitude,
                lng: path.coordinates.longitude,
                distance: distance + last_distance,
                package_id: path.package_id,
            });

            last_path = path.coordinates;
            last_distance = distance + last_distance;

            // console.log(warehouse, path.coordinates);
            // console.log(distance, "2");
        }
        last_distance = 0;
        last_path = warehouse;
    }

    return data;
}

async function main() {
    console.log("Hello world!");
    const check = (await redis.checkScript()) === "true" ? true : false;
    console.log(check);
    if (check) {
        const time = Number(await redis.getScriptTime());
        await redis.saveScriptTime(Number(time) + 10000);
        const speed = Number(await redis.getScriptSpeed());
        console.log(speed, time);
        const distance = (time * speed) / 1000;
        const data = await getRiders();

        for await (const rider of Object.keys(data)) {
            const locations = data[rider];
            for (const location of locations) {
                console.log(distance, location.distance);
                if (location.distance >= distance) {
                    console.log("Rider: ", rider, "Location: ", location, distance);
                    let value = {};
                    value.coordinates = {latitude: location.latitude * factor, longitude: location.longitude * factor};
                    await Package.findByIdAndUpdate(location.package_id, {status: "DELIVERED"});
                    await Status.create({package_id: location.package_id, status: "DELIVERED"});
                    await redis.setRiderData(value, rider);
                    break;
                }
            }
            console.log(rider);
        }
    }
}

setInterval(() => main(), 10000);
