import axios from "axios";
import config from "../config/config.js";
import Status from "../models/status.js";
import Package from "../models/package.js";
import Route from "../models/route.js";
import {setTimeout} from "timers/promises";
import {faker} from "@faker-js/faker";
import redis from "../database/redis.js";
import moment from "moment";
import fs from "fs";
import kmeans from "node-kmeans";
import path from "path";
import lemmatize from "wink-lemmatizer";

const RandomRange = (min, max) => {
    return Math.floor(Math.random() * (max - min) + min);
};
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
Number.prototype.toRad = function () {
    return (this * Math.PI) / 180;
};

const haversineDistance = (riderCoordinates, pkgCoordinates) => {
    const lat1 = riderCoordinates.latitude / parseFloat(config.scalingFactor);
    const lon1 = riderCoordinates.longitude / parseFloat(config.scalingFactor);

    const lat2 = pkgCoordinates.latitude / parseFloat(config.scalingFactor);
    const lon2 = pkgCoordinates.longitude / parseFloat(config.scalingFactor);

    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180; // φ, λ in radians
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // in metres
    return d / parseFloat(1000);
};

const getCoordinatesFromAddress = async address => {
    const data = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${config.googleApiKey}`
    );
    return data;
};

const calcAverage = (pkg, type) => {
    let val = 0;
    pkg.forEach(p => {
        val += Number(p.dimensions[type]);
    });

    return val / pkg.length;
};

const filterError = (pkg, type) => {
    const avg = calcAverage(pkg, type);
    const change = pkg.reduce((acc, vap) => acc + Math.abs(vap.dimensions[type] - avg), 0);
    const error = (change * 100) / (pkg.length * avg);
    return {avg, error};
};

const calculateErrorfromPackage = pkg => {
    pkg = pkg.map(function (p) {
        const val = p.dimensions;
        Object.assign(p.dimensions, {volumetric: String(val.length * val.breadth * val.height)});
        return p;
    });

    const lengthError = filterError(pkg, "length");
    const breathError = filterError(pkg, "breadth");
    const heightError = filterError(pkg, "height");
    const weightError = filterError(pkg, "weight");
    const volumetricError = filterError(pkg, "volumetric");
    return {
        length: lengthError,
        breadth: breathError,
        height: heightError,
        weight: weightError,
        volume: volumetricError,
    };
};

const groupPackagesByLocation = packageList => {
    const groupedPackages = {};

    packageList.forEach(pkg => {
        const coordKey = String(pkg.coordinates.latitude) + String(pkg.coordinates.longitude);
        if (groupedPackages[coordKey]) {
            groupedPackages[coordKey].push(pkg);
        } else {
            groupedPackages[coordKey] = [pkg];
        }
    });

    let groupedPackagesByLocation = [];
    for (const [coordKey, pkgList] of Object.entries(groupedPackages)) {
        const groupedObject = {};
        groupedObject.packages = pkgList;
        groupedObject.coordinates = pkgList[0].coordinates;
        groupedPackagesByLocation.push(groupedObject);
    }

    return groupedPackagesByLocation;
};

function writeDataToFile(data) {
    fs.appendFileSync("./tmp/dispatch.txt", JSON.stringify(data.status) + " " + JSON.stringify(data.data) + "\n");
}

const addDropLocation = async row => {
    //google api fails for address startign with #
    // row example: ['addres','area','phone','name','sku_id','','',]
    let new_row = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
    row = new_row;
    new_row = Object.fromEntries(Object.entries(row).map(([k, v]) => [lemmatize.noun(k), v]));
    row = new_row;
    console.log(new_row);
    const headers = {
        address: "address",
        edd: "edd",
        name: "name",
        awb: "awb",
        sku_id: "sku_id",
    };
    // row = new_row;

    if (row[headers.address].charAt(0) === "#") {
        row[headers.address] = row[headers.address].slice(1);
    }
    row[headers.address] = row[headers.address] + ", Bangalore";

    let data = await getCoordinatesFromAddress(row[headers.address]);

    writeDataToFile(data);
    data = data.data;

    if (data != undefined && data.results.length > 0) {
        const coordinates = {
            latitude: ~~(data.results[0]?.geometry.location.lat * config.scalingFactor),
            longitude: ~~(data.results[0]?.geometry.location.lng * config.scalingFactor),
            address: row[headers.address],
        };

        const redisCoordinates = {
            latitude: data.results[0]?.geometry.location.lat,
            longitude: data.results[0]?.geometry.location.lng,
        };

        const date = row[headers.edd] == undefined ? moment().format("DD-MM-YYYY") : row[headers.edd];
        const date_format = `${date} 09:00:00`;
        const momint = moment(date_format, "DD-MM-YYYY HH:mm:ss").valueOf();
        const m = ~~(momint / 1000);

        const images_list = [
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/clock.jpeg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/61Dw5Z8LzJL._SL1000_.jpg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/71i2XhHU3pL._SX466_.jpg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/download+(1).jpeg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/download+(2).jpeg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/download.jpeg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/pexels-math-90946+(1).jpg",
            "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/vwm915647-final-copy.jpg",
        ];

        console.log(row["product_id"]);
        const pkg = await Package.create({
            latest_status: "IN WAREHOUSE",
            awb_id: row[headers.awb],
            deliver_to: {name: row[headers.name], phone_number: faker.phone.number("+919#########")},
            sku_id: row[headers.sku_id] == undefined ? row["product_id"] : row[headers.sku_id],
            image_url: images_list[Math.floor(Math.random() * images_list.length)],
            type: "DELIVERY",
            coordinates,
            edd: m,
            dimensions: {
                length: row["length"] == undefined ? Math.random() * 27 + 3 : row["length"],
                breadth: row["breadth"] == undefined ? Math.random() * 27 + 3 : row["breadth"],
                height: row["height"] == undefined ? Math.random() * 17 + 3 : row["height"],
                weight: row["weight"] == undefined ? Math.random() * 20 + 5 : row["weight"],
            },
        });

        console.log(pkg);
        console.log(`Row ${row[headers.name]} saved`);
        await redis.addGeoData(redisCoordinates, pkg.id);
        await createStatus("IN WAREHOUSE", pkg._id);
    }
};

const createStatus = (status, package_id) => {
    return Status.create({status, package_id});
};

const checkError = async (length, breadth, height, weight, sku_id) => {
    const packages = await Package.find({sku_id: sku_id}, {dimensions: 1, _id: 0});
    const array = [];
    if (packages.length < 3) return "false";
    for (const pkg of packages) {
        array.push([pkg.dimensions.length, pkg.dimensions.breadth, pkg.dimensions.height, pkg.dimensions.weight]);
    }
    let new_data;
    let old_data = kmeans.clusterize(array, {k: 2}, (err, res) => {
        if (err) console.error(err);
        else return res;
    });

    console.log("old_data:", old_data.groups);

    array.push([length, breadth, height, weight]);
    new_data = kmeans.clusterize(array, {k: 2}, (err, res) => {
        if (err) console.error(err);
        else {
            return res;
        }
    });
    console.log("new_data", new_data.groups);

    const old_large_cluster = old_data.groups[0].clusterInd,
        old_small_cluster = old_data.groups[1].clusterInd;
    const new_large_cluster = new_data.groups[0].clusterInd,
        new_small_cluster = old_data.groups[1].clusterInd;

    if (old_large_cluster < new_large_cluster) return "NON_ERROR";
    else return "ERROR";
};

const createConfig = (start, dest, waypoints, optimize) => {
    var waypointConfig = {
        method: "get",
        url: `https://maps.googleapis.com/maps/api/directions/json?origin=${start}&destination=${dest}&waypoints=optimize:${optimize}|${waypoints}&key=${config.googleApiKey}`,
        headers: {},
    };
    return waypointConfig;
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

export {
    RandomRange,
    getCoordinatesFromAddress,
    calculateErrorfromPackage,
    groupPackagesByLocation,
    haversineDistance,
    createStatus,
    addDropLocation,
    checkError,
    getRouteWaypointsId,
    getWaypointGrp,
    getDistance,
};
