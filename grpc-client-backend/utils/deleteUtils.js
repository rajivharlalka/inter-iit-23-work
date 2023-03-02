import Route from "../models/route.js";
import Package from "../models/package.js";
import config from "../config/config.js";
import redis from "../database/redis.js";
import Notif from "../models/notifs.js";
import mongoose from "mongoose";
import {getRouteWaypointsId, getWaypointGrp, getDistance} from "./utils.js";

function getDeletePkgList(pkgList, stringmap) {
    let deletePkgList = [];

    for (let i = 0; i < pkgList.length; i++) {
        deletePkgList.push({
            id: Number(stringmap[pkgList[i]._id.toString()]),
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
    return deletePkgList;
}

async function getDeleteRequest(package_id, route_id) {
    let idmap = {};
    let stringmap = {};

    let route = await Route.findById(route_id).populate("paths").lean();
    let delPackage = await Package.findById(package_id).lean();
    let pkgList = route.paths;
    let objectIds = [];

    let i = 1;
    pkgList.map(pkg => {
        if (pkg._id.toString() != package_id) {
            idmap[i] = pkg._id.toString();
            stringmap[pkg._id.toString()] = i;
            objectIds.push(i);
            i++;
        } else {
            idmap[0] = package_id;
            stringmap[package_id] = 0;
            objectIds.push(0);
        }
    });

    const deletePkgList = getDeletePkgList(pkgList, stringmap);

    const hubLocation = JSON.parse(await redis.getWarehouse());

    let path = {
        vehicle: 0,
        objects: deletePkgList,
        volume: delPackage.dimensions.length * delPackage.dimensions.breadth * delPackage.dimensions.height,
        weight: delPackage.dimensions.weight,
        start: {
            latitude: hubLocation.latitude,
            longitude: hubLocation.longitude,
        },
        current_time: Math.round(Date.now() / 1000),
    };

    const deleteRequest = {
        del_id: 0,
        path: path,
    };

    return {deleteRequest, idmap};
}

async function updateDbDeleteResponse(response, idmap, route_id) {
    const {object_ids} = response;

    let updatedPkgs = [];
    for (let i = 0; i < object_ids.length; i++) {
        updatedPkgs.push(mongoose.Types.ObjectId(idmap[object_ids[i]]));
    }
    const route = await Route.findByIdAndUpdate(route_id, {paths: updatedPkgs}, {returnDocument: "after"});
    await Package.findByIdAndDelete(idmap[0]);
    await redis.removeGeoData(idmap[0]);

    await Notif.create({
        message: `Package Removed from Route id ${route_id}`,
        status_rider: "pending",
        status_warehouse: "pending",
    });

    const waypointId = await getRouteWaypointsId(route._id.toString());
    const waypointGrp = getWaypointGrp(waypointId);

    let distance = 0;
    for (let i = 0; i < waypointGrp.length; i++) {
        distance += await getDistance(waypointGrp[i]);
    }
    await Route.findByIdAndUpdate(route._id, {distance: distance});
}

export {getDeleteRequest, updateDbDeleteResponse};
