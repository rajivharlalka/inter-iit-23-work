import mongoose from "mongoose";
import logger from "../config/logger.js";
import {parse} from "csv-parse";
import fs from "fs";
import {faker} from "@faker-js/faker";
import Package from "../models/package.js";
import {getCoordinatesFromAddress} from "../utils/utility.js";
import config from "../config/config.js";
mongoose.set("strictQuery", false);

const addDropLocation = async row => {
    //google api fails for address startign with #
    if (row[0].charAt(0) === "#") {
        row[0] = row[0].slice(1);
    }

    const {data} = await getCoordinatesFromAddress(row[0]);

    if (data != undefined && data.results.length > 0) {
        const coordinates = {
            latitude: data.results[0]?.geometry.location.lat * 1000000,
            longitude: data.results[0]?.geometry.location.lng * 1000000,
            address: row[0],
        };

        const p = new Package({
            status: "CREATED",
            awb_id: faker.datatype.uuid(),
            deliver_to: {name: row[3], phone_number: row[2]},
            sku_id: row[4],
            image_url: "https://public-images-inter-iit.s3.ap-south-1.amazonaws.com/clock.jpeg",
            type: "DELIVERY",
            coordinates,
            dimensions: {
                length: Math.random() * 27 + 3,
                breadth: Math.random() * 27 + 3,
                height: Math.random() * 17 + 3,
                weight: Math.random() * 20 + 5,
            },
        });

        return p.save(err => {
            if (err) console.log(err);
            console.log(`Row ${row[3]} saved`);
        });
    }
};

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB");
});

fs.createReadStream("./scripts/dispatch.csv")
    .pipe(parse({delimiter: ","}))
    .on("data", async function (row) {
        await addDropLocation(row);
    })
    .on("end", function () {
        // process.exit();
    });

// ReadFileandrun();
