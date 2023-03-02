import Route from "./models/route.js";
import Package from "./models/package.js";
import redis from "./database/redis.js";
import config from "./config/config.js";
import axios from "axios";
import mongoose from "mongoose";
import fs from "fs";
import {writeDataToFile} from "./utils/utils.js";

mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

const getRouteWaypointsId = async route_id => {
    const route = await Route.findById(route_id).populate("paths").lean();
    const hub = JSON.parse(await redis.getWarehouse());

    const waypoints = [];

    waypoints.push(
        `${hub.latitude / parseFloat(config.scalingFactor)},${hub.longitude / parseFloat(config.scalingFactor)}`
    );

    const pkgList = route.paths;
    for (const pkg of pkgList) {
        waypoints.push(
            `${pkg.coordinates.latitude / parseFloat(config.scalingFactor)},${
                pkg.coordinates.longitude / parseFloat(config.scalingFactor)
            }`
        );
    }
    waypoints.push(
        `${hub.latitude / parseFloat(config.scalingFactor)},${hub.longitude / parseFloat(config.scalingFactor)}`
    );
    return waypoints;
};

const format_data = points => {
    const start = points[0];
    const end = points[points.length - 1];

    const waypoints = points.slice(1, points.length - 1);
    const waypoints_formatted = waypoints.join("|");

    return {start, end, waypoints: waypoints_formatted};
};

const getWaypointGrp = waypoints => {
    let cluster_size = waypoints.length == 26 ? 23 : 25;

    let waypointGrp = [];
    let small_grp = [];
    let grp = 0;
    for (let i = 0; i < waypoints.length; i++) {
        small_grp.push(waypoints[i]);
        grp++;

        if (grp == cluster_size) {
            const format = format_data(small_grp);
            waypointGrp.push(format);
            small_grp = [];
            grp = 0;
        }
    }

    const format = format_data(small_grp);
    waypointGrp.push(format);

    return waypointGrp;
};

const getDistance = async path => {
    var waypointConfig = {
        method: "get",
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${path.start}&destination=${path.end}&waypoints=${path.waypoints}&key=${config.googleApiKey}`,
        headers: {},
    };
    const response = await axios(waypointConfig);
    // fs.writeFile(`./tmp/response-${new Date()}`, JSON.stringify(response.data));

    let distance = 0;
    let time = 0;
    for (const leg of response.data.routes[0].legs) {
        distance += leg.distance.value;
        time += leg.duration.value;
    }

    return {distance, time};
};

async function getStats() {
    let stats = {};
    stats.orders = await Package.find({}).countDocuments();
    stats.riders_count = await Route.find({}).countDocuments();

    let avgDistanceList = [];
    let avgTimeList = [];

    let totalDistance = 0;

    stats.riders = [];

    const routeList = await Route.find({}).populate("paths").lean();
    let medianList = [];

    for await (const route of routeList) {
        medianList.push(route.paths.length);
        const waypoints = await getRouteWaypointsId(route._id.toString());
        const waypointGrp = getWaypointGrp(waypoints);

        let distance = 0;
        let time = 0;
        for await (const path of waypointGrp) {
            const {distance: d, time: t} = await getDistance(path);
            distance += d;
            time += t;
        }

        console.log(route.rider_id, distance, time);
        avgDistanceList.push(distance);
        avgTimeList.push(time);

        stats.riders.push({
            rider_id: route.rider_id,
            distance,
            time,
        });
        totalDistance += distance;
    }
    stats.totalDistance = totalDistance;
    stats.avgDistance = avgDistanceList.reduce((a, b) => a + b, 0) / avgDistanceList.length;
    stats.avgTime = avgTimeList.reduce((a, b) => a + b, 0) / avgTimeList.length;
    stats.median = medianList.sort((a, b) => a - b)[Math.floor(medianList.length / 2)];

    console.log(stats);
    writeDataToFile(stats, "stats");
    // fs.writeFile("./tmp/stats.json", JSON.stringify(JSON.parse(stats)));
}

getStats();
