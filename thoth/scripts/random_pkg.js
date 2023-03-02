import mongoose from "mongoose";
import Package from "../models/package.js";
import {faker} from "@faker-js/faker";
import fs from "fs";
import config from "../config/config.js";
import {createStatus, getCoordinatesFromAddress} from "../utils/utility.js";

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

(async function main() {
    parseCSV();
    console.table(address);
    await mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
        console.log("Mongoose connected");
    });

    for await (const ad of address) {
        const data = await getCoordinatesFromAddress(ad);
        writeDataToFile(data);
        if (data.data != undefined && data.data.results.length > 0) {
            const pkg = generateRandomData(ad, data.data.results[data.data.results.length - 1]?.geometry.location);
            const dispatch = new Package(pkg);
            const d = await dispatch.save();
            await createStatus("IN_WAREHOUSE", dispatch.id);
            console.log(d);
        }
    }
    await mongoose.disconnect();
})();
