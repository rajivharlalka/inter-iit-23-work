import catchAsync from "../utils/catchAsync.js";
import Package from "../models/package.js";
import Status from "../models/status.js";
import config from "../config/config.js";
import redis from "../database/redis.js";
import {getCoordinatesFromAddress, createStatus, checkError} from "../utils/utility.js";
import rabbit from "../utils/rabbitmq.js";

// const createItem = async (name, dimensions) => {
//     const item = await Item.findOne({name});
//     if (item) {
//         return item;
//     }
//     return await Item.create({
//         name,
//         dimensions,
//     });
// };

// const addItem = catchAsync(async (req, res) => {
//     const {name, dimensions} = req.body;
//     const item = createItem(name, dimensions);
//     console.log(item);
//     res.status(200).json({message: "Item Added", item});
// });

const addDeliveryPackage = catchAsync(async (req, res) => {
    const {awb_id, sku_id, deliver_to, address, dimensions, type} = req.body;
    const {data} = await getCoordinatesFromAddress(address);
    const coordinates = {
        latitude: data.results[1].geometry.location.lat,
        longitude: data.results[1].geometry.location.lng,
        address,
    };
    const deliveryPackage = await Package.create({
        awb_id,
        sku_id,
        deliver_to: {
            name: deliver_to.name,
            phone_number: deliver_to.phone_number,
        },
        dimensions,
        coordinates: {
            latitude: Math.floor(coordinates.latitude * config.scalingFactor),
            longitude: Math.floor(coordinates.longitude * config.scalingFactor),
            address,
        },
        type,
    });
    await createStatus("IN WAREHOUSE", deliveryPackage._id);
    console.log(deliveryPackage);
    await redis.addGeoData(coordinates, deliveryPackage.id);
    res.status(200).json({message: "Delivery Package Added", deliveryPackage});
});

const getPackageDetails = catchAsync(async (req, res) => {
    const {package_id} = req.query;
    const pkg = await Package.findById(package_id);
    const status = await Status.find({package_id}, "status createdAt -_id");
    res.status(200).json({message: "Package Details", pkg, status});
});

const getPackageList = catchAsync(async (req, res) => {
    // const {awb_id} = req.query;
    const pkg = await Package.find({...req.query});
    res.status(200).json({message: "Package List", package: pkg});
});

const uploadImageController = catchAsync(async (req, res) => {
    let {awb_id} = req.query;
    if (awb_id == undefined) {
        //fetch a random Package
        const pkg = await Package.findOne({type: "RIDER ASSIGNED"});
        awb_id = pkg.awb_id;
    }
    const {length, breadth, height, weight} = req.body;
    const pkgF = await Package.findOne({awb_id: awb_id});
    const sku_id = pkgF.sku_id;
    const error = await checkError(length, breadth, height, weight, sku_id);
    if (error == "false") console.log("Less Packages");
    else {
        console.log(error);
        if (error == "ERROR") {
            const pkg = await Package.find({awb_id}).lean();
            console.log(pkg);
            await Status.create({package_id: pkg._id, status: "ERRONEUS"});
            await Package.findOneAndUpdate({awb_id}, {latest_status: "ERRONEUS"});
        }
    }

    const fileName = req.file.location;
    const pkg = await Package.findOneAndUpdate(
        {awb_id},
        {image_url: fileName, dimensions: {length, breadth, height, weight}},
        {returnDocument: "after"}
    );

    res.status(200).json({message: "Image uploaded", pkg});
});

const uploadDataController = catchAsync(async (req, res) => {
    const {length, breadth, height, weight, sku_id} = req.body;
    length = length == undefined ? Math.random() * 27 + 3 : length;
    breadth = breadth == undefined ? Math.random() * 27 + 3 : breadth;
    height = height == undefined ? Math.random() * 27 + 3 : height;
    weight = weight == undefined ? Math.random() * 27 + 3 : weight;
    const pkg = await Package.updateMany({sku_id}, {dimensions: {length, breadth, height, weight}});

    res.status(200).json({message: "Image uploaded", pkg});
});

const addDynamicPackage = catchAsync(async (req, res) => {
    const {address, deliver_to, awb_id, sku_id} = req.body;
    const {data} = await getCoordinatesFromAddress(address);
    const coordinates = {
        latitude: data.results[data.results.length - 1].geometry.location.lat,
        longitude: data.results[data.results.length - 1].geometry.location.lng,
        address,
    };

    const deliveryPackage = await Package.create({
        awb_id,
        sku_id,
        deliver_to: {
            name: deliver_to.name,
            phone_number: deliver_to.phone_number,
        },
        coordinates: {
            latitude: Math.floor(coordinates.latitude * config.scalingFactor),
            longitude: Math.floor(coordinates.longitude * config.scalingFactor),
            address,
        },
        type: "PICKUP",
        status: "DELIVERED",
    });

    await createStatus("DELIVERED", deliveryPackage.id);

    const channel = rabbit.getChannel();
    channel.sendToQueue("dynamic", Buffer.from(JSON.stringify({message: deliveryPackage})));
    res.status(200).json({message: "Dynamic point added"});
});

const deletePackage = catchAsync(async (req, res) => {
    const {route_id, package_id} = req.body;
    const channel = rabbit.getChannel();
    channel.sendToQueue("delete", Buffer.from(JSON.stringify({message: {route_id, package_id}})));
    res.status(200).json({message: "Package will be deleted in some time"});
});

export default {
    getCoordinatesFromAddress,
    addDeliveryPackage,
    getPackageDetails,
    getPackageList,
    uploadImageController,
    addDynamicPackage,
    deletePackage,
    uploadDataController,
};
