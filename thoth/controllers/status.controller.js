import catchAsync from "../utils/catchAsync.js";
import Package from "../models/package.js";
import Status from "../models/status.js";
import Route from "../models/route.js";
import {haversineDistance} from "../utils/utility.js";
import redis from "../database/redis.js";
import moment from "moment";

const updateStatus = catchAsync(async (req, res) => {
    let {status, package_id, rider_id} = req.body;
    const pkg = await Package.findById(package_id);

    if (status === "DELIVERED" || status === "PICKED") {
        const rider = JSON.parse(await redis.getRiderData(rider_id));
        const eddDate = moment.unix(pkg.edd).format("DD-MM-YYYY");
        const diff = moment().diff(eddDate, "days");

        // currDate > eddDate
        if (diff >= 1) {
            const route = await Route.findOneAndUpdate(
                {rider_id: rider._id},
                {$push: {delayed_pkgs: pkg._id}},
                {returnDocument: "after"}
            );
            console.log(route);
        }

        const distance = haversineDistance(rider.coordinates, pkg.coordinates);
        console.log(distance);
        if (distance >= 0.2) {
            status = "FAKE ATTEMPT";
        }
    }

    const statusItem = await Status.create({status, package_id});
    Package.findByIdAndUpdate(package_id, {latest_status: status}, function (err) {
        if (err) {
            console.log(err);
        }
    });

    console.log(statusItem);
    res.status(201).json({message: "Status Updated", statusItem});
});

const unmarkStatus = catchAsync(async (req, res) => {
    const {package_id} = req.body;
    const status = await Status.find({package_id}).sort({createdAt: -1}).limit(2);
    await Status.findByIdAndDelete(status[0]._id);
    const pkg = await Package.findByIdAndUpdate(
        package_id,
        {latest_status: status[1].status},
        {returnDocument: "after"}
    );
    res.status(200).json({message: "Status Unmarked", pkg});
});

export default {updateStatus, unmarkStatus};
