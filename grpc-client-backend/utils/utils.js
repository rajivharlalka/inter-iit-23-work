import fs from "fs";
import axios from "axios";
import Status from "../models/status.js";
import config from "../config/config.js";
import Route from "../models/route.js";
import redis from "../database/redis.js";

function writeDataToFile(data, fileName) {
    fs.appendFileSync(`./tmp/${fileName}.json`, JSON.stringify(data));
}

const getCoordinatesFromAddress = async address => {
    const data = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${config.googleApiKey}`
    );
    return data;
};

const createStatus = async (status, package_id) => {
    const mongoStatus = await Status.findOne({status, package_id});
    if (mongoStatus) return mongoStatus;
    return Status.create({status, package_id});
};

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
    console.log(waypoints);
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
    console.log(response.data);
    // fs.writeFile(`./tmp/response-${new Date()}`, JSON.stringify(response.data));

    let distance = 0;
    for (const leg of response.data.routes[0].legs) {
        distance += leg.distance.value;
    }

    return distance;
};

export {writeDataToFile, getCoordinatesFromAddress, createStatus, getRouteWaypointsId, getWaypointGrp, getDistance};
