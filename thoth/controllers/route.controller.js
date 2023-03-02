import catchAsync from "../utils/catchAsync.js";
import Rider from "../models/rider.js";
import Package from "../models/package.js";
import Notif from "../models/notifs.js";
import Route from "../models/route.js";
import {groupPackagesByLocation} from "../utils/utility.js";
import redis from "../database/redis.js";

const addRoute = catchAsync(async (req, res) => {
    const {rider_id, paths} = req.body;

    const route = await Route.create({rider_id, paths});
    console.log(route);
    res.status(200).json({message: "Route Added", route});
});

const getRouteDetails = catchAsync(async (req, res) => {
    const {route_id} = req.query;
    const route = await Route.findById(route_id).populate("paths");
    const rider = await Rider.findById(route.rider_id);
    const groupedPackages = groupPackagesByLocation(route.paths);
    const numberOfGroups = groupedPackages.length;
    const numberOfPackages = route.paths.length;

    const warehouse = JSON.parse(await redis.getWarehouse());

    res.status(200).json({
        message: "Route Details",
        rider,
        route: groupedPackages,
        warehouse,
        number_points: numberOfGroups,
        number_packages: numberOfPackages,
    });
});

const getRouteList = catchAsync(async (req, res) => {
    let query = {};
    if (req.query.rider_id) query.rider_id = req.query.rider_id;

    console.log({...query});
    let routeList = await Route.find({...query})
        .populate("paths")
        .lean();

    routeList = await Promise.all(
        routeList.map(async routeItem => {
            let ri = routeItem;
            ri.rider = await Rider.findById(routeItem.rider_id);
            const groupedPackages = groupPackagesByLocation(routeItem.paths);
            ri.route = groupedPackages;
            ri.number_points = groupedPackages.length;
            ri.number_packages = routeItem.paths.length;

            delete ri.paths;
            delete ri.rider_id;

            return ri;
        })
    );

    res.status(200).json({message: "Route list", routes: routeList});
});

const updateRider = catchAsync(async (req, res) => {
    const {route_id, rider_id} = req.body;
    const rider = Route.findByIdAndUpdate(route_id, {rider_id: rider_id}, function (err) {
        if (err) {
            console.log(err);
        }
    });
    res.status(200).json({message: "Rider updated"});
});

const updateRoute = catchAsync(async (req, res) => {
    const {route_id, paths} = req.body;
    const route = await Route.findByIdAndUpdate(route_id, {paths: paths}, {returnDocument: "after"});

    await Notif.create({
        message: `Route updated for route ${route_id}`,
        status_warehouse: "pending",
        status_rider: "pending",
    });

    res.status(200).json({message: "Route updated", new_route: route});
});

export default {addRoute, getRouteDetails, getRouteList, updateRider, updateRoute};
