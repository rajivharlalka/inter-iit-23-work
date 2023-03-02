import catchAsync from "../utils/catchAsync.js";
import config from "../config/config.js";
import ApiError from "../utils/ApiError.js";
import Rider from "../models/rider.js";

const loginAdmin = catchAsync(async (req, res) => {
    if (req.body.email != config.auth.admin.email || req.body.password != config.auth.admin.password)
        throw new ApiError(500, "Invalid Credentials");

    res.status(200).json({message: "Logged in"});
});

const loginRider = catchAsync(async (req, res) => {
    const {email, password} = req.body;

    const rider = await Rider.findOne({email});
    console.log(rider);
    if (!rider) {
        throw new ApiError(500, "No rider with such email found");
    }

    if (password != config.auth.rider.password) throw new ApiError(500, "Invalid Pasword");

    res.status(200).json({message: "Login Success", rider});
});

export default {loginAdmin, loginRider};
