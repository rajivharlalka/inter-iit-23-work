import redis from "../database/redis.js";
import catchAsync from "../utils/catchAsync.js";
import Rider from "../models/rider.js";
import Package from "../models/package.js";
import {faker} from "@faker-js/faker";
import {groupPackagesByLocation} from "../utils/utility.js";
import Route from "../models/route.js";

const addRider = catchAsync(async (req, res) => {
    const {name, phone, email} = req.body;
    const rider = await Rider.create({name, phone, email});
    res.status(200).json({message: "Rider Added", rider});
});

// const updateRiderLocation = catchAsync(async (req, res) => {
//     const {rider_id, coordinates} = req.body;
//     const rider = JSON.parse(await redis.getRiderData(rider_id.toString()));
//     rider.coordinates = coordinates;
//     await redis.updateRiderData(rider.id, rider);
//     console.log(rider);
//     res.status(200).json({message: "data updated"});
// });

const setRiderLocation = catchAsync(async (req, res) => {
    const {rider_id, coordinates} = req.body;
    let value = {};
    value.coordinates = coordinates;
    await redis.setRiderData(value, rider_id);
    res.status(200).json({message: "Rider location set", value});
});

const getRiderLocation = catchAsync(async (req, res) => {
    const {rider_id} = req.query;
    let rider;
    if (rider_id) rider = JSON.parse(await redis.getRiderData(req.query.rider_id));
    else {
        rider = await redis.getAllRiderData();
        rider = rider.map(rdr => {
            return JSON.parse(rdr);
        });
    }
    res.status(200).json({message: "Rider location", rider});
});

const getPackagesOfRider = catchAsync(async (req, res) => {
    const {rider_id} = req.query;
    const route = await Route.findOne({rider_id}).populate("paths");
    const rider = await Rider.findById(rider_id);
    const groupedPackages = groupPackagesByLocation(route.paths);
    const numberOfGroups = groupedPackages.length;
    const numberOfPackages = route.paths.length;

    res.status(200).json({
        message: "Rider Packages",
        route: groupedPackages,
        number_points: numberOfGroups,
        number_packages: numberOfPackages,
    });
});

const getAllRiders = catchAsync(async (req, res) => {
    let riders = await Rider.find({}).lean();
    riders = await Promise.all(
        riders.map(async rdr => {
            const route = await Route.find({rider_id: rdr._id}).lean();
            rdr.assigned = false;
            if (route.length) {
                rdr.assigned = true;
            }
            return rdr;
        })
    );

    res.status(200).json({message: "Riders", riders});
});

// const getRiderDetails = catchAsync(async (req, res) => {
//     const {rider_id} = req.query;
//     const rider = await Rider.findById(rider_id);
//     const packageList = await Package.find({rider_id});
//     const groupedPackageList = groupPackagesByLocation(packageList);
//     res.status(200).json({message: "Rider Details", rider: rider, packages: groupedPackageList});
// });

export default {setRiderLocation, getRiderLocation, addRider, getPackagesOfRider, getAllRiders};
