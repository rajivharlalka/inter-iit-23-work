import Route from "../models/route.js";
import Package from "../models/package.js";
import {faker} from "@faker-js/faker";
import logger from "../config/logger.js";
import mongoose from "mongoose";
import config from "../config/config.js";
mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB");
});
let i = 0;
let k = 1;
let pkg = [];
let val = [];

let packages;
Package.find()
    .then(data => {
        for (i = 0; i < data.length; i++) {
            if (k == 10) {
                val.push(new Route({paths: pkg}).save());
                pkg = [];
                k = 0;
            }

            pkg.push(data[i].id);
            k++;
        }

        Promise.all(val)
            .then(data => console.log(data))
            .catch(err => {
                console.log(err);
            });
    })
    .catch(err => {
        console.log(err);
    });
