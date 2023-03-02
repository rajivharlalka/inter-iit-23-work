import moment from "moment";
import mongoose from "mongoose";
import {getCoordinatesFromAddress, createStatus} from "./utils.js";
import Bin from "../models/bin.js";
import Package from "../models/package.js";
import Route from "../models/route.js";
import config from "../config/config.js";
import redis from "../database/redis.js";
import Notif from "../models/notifs.js";
import {getRouteWaypointsId, getWaypointGrp, getDistance} from "./utils.js";

function getTopPkgList(pkgList, pkgStringmap) {
    let topPkgList = [];
    for (let i = 0; i < pkgList.length; i++) {
        topPkgList.push(pkgStringmap[pkgList[i]._id.toString()]);
    }
    return topPkgList;
}

function getDynamicPkgList(pkgList, pkgStringmap) {
    let dynamicPkgList = [];

    for (let i = 0; i < pkgList.length; i++) {
        dynamicPkgList.push({
            id: Number(pkgStringmap[pkgList[i]._id.toString()]),
            length: Math.floor(pkgList[i].dimensions.length),
            breadth: Math.floor(pkgList[i].dimensions.breadth),
            height: Math.floor(pkgList[i].dimensions.height),
            x: 0,
            y: 0,
            z: 0,
            is_delivery: pkgList[i].type === "DELIVERY" ? true : false,
            location: {
                latitude: pkgList[i].coordinates.latitude,
                longitude: pkgList[i].coordinates.longitude,
            },
            weight: Math.floor(pkgList[i].dimensions.weight),
            edd: pkgList[i].edd,
            threat_metric: ~~(pkgList[i].threat * config.scalingFactor),
        });
    }
    return dynamicPkgList;
}

async function getDynamicRequest(pkg) {
    let pkgIdmap = {};
    let riderIdmap = {};
    let pkgStringmap = {};

    const {data} = await getCoordinatesFromAddress(pkg.address);

    const hubLocation = JSON.parse(await redis.getWarehouse());

    const coordinates = {
        latitude: data.results[data.results.length - 1].geometry.location.lat,
        longitude: data.results[data.results.length - 1].geometry.location.lng,
        address: pkg.address,
    };

    const mongoPkg = await Package.create({
        awb_id: pkg.awb_id,
        sku_id: pkg.sku_id,
        deliver_to: pkg.deliver_to,
        coordinates: {
            latitude: ~~(coordinates.latitude * config.scalingFactor),
            longitude: ~~(coordinates.longitude * config.scalingFactor),
            address: coordinates.address,
        },
        type: "PICKUP",
        edd: moment(pkg.edd, "YYYY-MM-DDTHH:mm:ss").valueOf() / 1000,
    });

    console.log(mongoPkg);

    await createStatus("PICKED", mongoPkg._id);

    pkgIdmap[0] = mongoPkg._id.toString();
    pkgStringmap[mongoPkg._id.toString()] = 0;
    let pkgList = await redis.getGeoLocations(coordinates);

    console.log("redis pkgs =", pkgList.length);
    let objectIds = [];

    let i = 1;
    pkgList.map(pkg => {
        pkgIdmap[i] = pkg.member;
        pkgStringmap[pkg.member] = i;
        objectIds.push(i);
        i++;
    });

    i = 1;
    let routeList = await Route.find({}).sort({_id: -1}).limit(15).populate("paths").lean();
    console.log("routeList =", routeList.length);
    let paths = [];
    let reqObjectIds = [];

    for await (let route of routeList) {
        riderIdmap[i] = route.rider_id.toString();
        const bin = await Bin.findById(route.bin_id).lean();
        let pkgList = route.paths;

        pkgList = pkgList.map(pkg => {
            if (pkg.latest_status !== "DELIVERED" && pkg.latest_status !== "PICKED") {
                return pkg;
            }
        });

        const dynamicObjectList = getDynamicPkgList(pkgList, pkgStringmap);
        const topPkgList = getTopPkgList(pkgList, pkgStringmap);
        // console.log(dynamicObjectList);
        // console.log(topPkgList);
        reqObjectIds.push(...topPkgList);

        paths.push({
            vehicle: i,
            objects: dynamicObjectList,
            volume: bin.dimensions.length * bin.dimensions.breadth * bin.dimensions.height,
            weight: ~~bin.dimensions.weight,
            start: {
                latitude: hubLocation.latitude,
                longitude: hubLocation.longitude,
            },
            current_time: Math.round(Date.now() / 1000),
        });
        i++;
    }
    reqObjectIds.sort((a, b) => a - b);

    let dynamicRequest = {
        pickup: {
            id: 0,
            length: 0,
            breadth: 0,
            height: 0,
            x: 0,
            y: 0,
            z: 0,
            is_delivery: false,
            location: {
                latitude: ~~(coordinates.latitude * config.scalingFactor),
                longitude: ~~(coordinates.longitude * config.scalingFactor),
            },
            weight: 0,
            edd: mongoPkg.edd,
            threat_metric: mongoPkg.threat,
        },
        object_ids: reqObjectIds,
        paths: paths,
        hub: hubLocation,
    };
    await redis.addGeoData(coordinates, mongoPkg.id);

    return {dynamicRequest, pkgIdmap, riderIdmap};
}

async function updateDbDynamicResponse(response, pkgIdmap, riderIdmap) {
    const {vehicle, object_ids} = response;

    let riderId = mongoose.Types.ObjectId(riderIdmap[vehicle]);
    let updatedPkgs = [];
    for (let i = 0; i < object_ids.length; i++) {
        updatedPkgs.push(mongoose.Types.ObjectId(pkgIdmap[object_ids[i]]));
    }
    const routef = await Route.findOne({rider_id: riderId});
    await Notif.create({
        message: `Dynamic Pickup Request Accepted by Vehicle ${vehicle}`,
        route_id: routef._id,
        status_rider: "pending",
        status_warehouse: "pending",
    });
    console.log(routef.paths.length);
    let route = await Route.findOneAndUpdate({rider_id: riderId}, {paths: updatedPkgs}, {returnDocument: "after"});
    console.log(route);
    console.log(route.paths.length);

    const waypointId = await getRouteWaypointsId(route._id.toString());
    const waypointGrp = getWaypointGrp(waypointId);

    let distance = 0;
    for (let i = 0; i < waypointGrp.length; i++) {
        distance += await getDistance(waypointGrp[i]);
    }
    await Route.findByIdAndUpdate(route._id, {distance: distance});
}

export {getDynamicRequest, updateDbDynamicResponse};
