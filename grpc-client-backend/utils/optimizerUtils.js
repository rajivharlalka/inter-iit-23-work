import Package from "../models/package.js";
import Notif from "../models/notifs.js";
import Bin from "../models/bin.js";
import Route from "../models/route.js";
import Rider from "../models/rider.js";
import Status from "../models/status.js";
import mongoose from "mongoose";
import {faker} from "@faker-js/faker";
import {getRouteWaypointsId, getWaypointGrp, getDistance} from "./utils.js";

async function getOptimizerRequest(riders) {
    let idmap = {};
    let pkgs = await Package.find({latest_status: "IN WAREHOUSE"}, "coordinates dimensions")
        .sort({edd: "ascending"})
        .lean();
    console.log(pkgs.length);
    let i = 1;
    pkgs = pkgs.map(pkg => {
        idmap[i] = pkg._id.toString();
        let newPkg = {
            id: i,
            size: {
                length: pkg.dimensions.length,
                width: pkg.dimensions.breadth,
                height: pkg.dimensions.height,
            },
            coordinates: {
                latitude: pkg.coordinates.latitude,
                longitude: pkg.coordinates.longitude,
            },
            weight: pkg.dimensions.weight,
        };
        i++;
        return newPkg;
    });

    const bin = {
        size: {
            length: 80,
            width: 80,
            height: 80,
        },
        capacity: 80 * 80 * 80,
    };

    const warehouse = {
        latitude: 12907009,
        longitude: 77585678,
    };

    // const riders = (await Rider.find({}).lean()).length;
    if (riders === -1) {
        riders = ~~(pkgs.length / 20);
    }

    const optimizerRequest = {
        packages: pkgs,
        bin,
        riders: riders,
        warehouse,
    };
    return {optimizerRequest, idmap};
}

async function updateDbOptimizerResponse(response, idmap) {
    const {clusters} = response;

    await Notif.create({message: "Optimiser Response Recieved", status_warehouse: "pending", status_rider: "pending"});

    for (let i = 0; i < clusters.length; i++) {
        let group = [];
        let binPkgs = [];
        const cluster = clusters[i];
        for await (const pkg of cluster.packages) {
            const objectId = mongoose.Types.ObjectId(idmap[pkg.id]);

            group.push(objectId);

            // Update Status of packages that were sent to Optimiser
            await Status.create({status: "SCANNING", package_id: objectId});
            await Status.create({status: "FORMING CLUSTER", package_id: objectId});
            await Status.create({status: "RIDER ASSIGNED", package_id: objectId});
            await Package.findByIdAndUpdate(objectId, {latest_status: "RIDER ASSIGNED"});

            binPkgs.push({
                package_id: objectId,
                length: pkg.position.length,
                breadth: pkg.position.breadth,
                height: pkg.position.height,
                x: pkg.position.x,
                y: pkg.position.y,
                z: pkg.position.z,
            });
        }

        const rider = await Rider.create({
            name: faker.name.fullName(),
            email: `test_${i + 1}@gmail.com`,
            phone: faker.phone.number("+919#########"),
        });

        const bin = await Bin.create({
            dimensions: {length: 80, breadth: 80, height: 80, weight: Math.random() * 20 + 5},
            packages: binPkgs,
        });
        const route = await Route.create({rider_id: rider._id, paths: group, bin_id: bin._id});
        console.log(route);

        const waypointId = await getRouteWaypointsId(route._id.toString());
        const waypointGrp = getWaypointGrp(waypointId);
        console.log(waypointGrp);

        let distance = 0;
        for (let i = 0; i < waypointGrp.length; i++) {
            distance += await getDistance(waypointGrp[i]);
        }
        await Route.findByIdAndUpdate(route._id, {distance: distance});
    }
}

export {getOptimizerRequest, updateDbOptimizerResponse};
