import mongoose from "mongoose";
import Package from "../models/package.js";
import {faker} from "@faker-js/faker";
import fs from "fs";
import config from "../config/config.js";
import {createStatus, getCoordinatesFromAddress} from "../utils/utility.js";
import Rider from "../models/rider.js";
import {table} from "console";
import Route from "../models/route.js";
import Bin from "../models/bin.js";

mongoose.set("strictQuery", false);

const generateRandomData = (address, coordinate) => {
    const data = {
        image_url: "https://via.placeholder.com/150",
        sku_id: "SKU_" + ~~(Math.random() * 100 + 1),
        awb_id: Math.random().toString(36).substring(2, 15),
        deliver_to: {
            name: faker.name.fullName(),
            phone_number: faker.phone.number("+919#########"),
        },
        coordinates: {
            latitude: ~~(coordinate.lat * 1000000),
            longitude: ~~(coordinate.lng * 1000000),
            address: address,
        },
        dimensions: {
            length: Math.floor(Math.random() * 37) + 3,
            breadth: Math.floor(Math.random() * 37) + 3,
            height: Math.floor(Math.random() * 17) + 3,
            weight: Math.floor(Math.random() * 29) + 1,
        },
        delivered_time: new Date(),
        type: ["DELIVERY", "PICKUP"][Math.floor(Math.random() * 2)],
        latest_status: "IN_WAREHOUSE",
    };
    return data;
};

let address;
function parseCSV() {
    address = fs.readFileSync("./scripts/dispatch.csv", "utf-8").split(/\r?\n/);
    for (let i in address) {
        address[i] = address[i].split('"')[1];
    }
}

function writeDataToFile(data) {
    fs.appendFileSync("./tmp/dispatch.txt", JSON.stringify(data.status) + " " + JSON.stringify(data.data) + "\n");
}

let group = [];

(async function main() {
    await mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
        console.log("Mongoose connected");
    });
    const routes = await Route.find({}, "_id paths").lean();
    // const packages = await Package.find({}, "_id").lean();
    let j = 0,
        k = 0;
    for await (const route of routes) {
        const pkgs = route.paths;
        let binPkgs = [];
        for await (const id of pkgs) {
            const pkg = await Package.findById(id);
            binPkgs.push({
                package_id: pkg._id,
                length: pkg.dimensions.length,
                breadth: pkg.dimensions.breadth,
                height: pkg.dimensions.height,
                weight: pkg.dimensions.weight,
                x: 0,
                y: 0,
                z: 10 * j++,
            });
        }
        const bin = await Bin.create({
            dimensions: {
                length: 80,
                breadth: 80,
                height: 80,
                weight: Math.floor(Math.random() * 29) + 1,
            },
            packages: binPkgs,
        });
        await Route.findByIdAndUpdate(route._id, {
            bin_id: bin,
        });
    }

    await mongoose.disconnect();
})();
