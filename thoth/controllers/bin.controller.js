import catchAsync from "../utils/catchAsync.js";
import Rider from "../models/rider.js";
import Route from "../models/route.js";
import Bin from "../models/bin.js";

const getBinList = catchAsync(async (req, res) => {
    const {route_id, rider_id} = req.query;
    let route;

    if (route_id) route = await Route.findById(route_id);
    else route = await Route.findOne({rider_id});
    const bin = await Bin.findById(route.bin_id);

    res.status(200).json({message: "Bin details", bin});
});

export default {getBinList};
