import Rider from "../models/rider.js";
import {faker} from "@faker-js/faker";
import logger from "../config/logger.js";
import mongoose from "mongoose";
import config from "../config/config.js";
mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
    logger.info("Connected to MongoDB");
});

let hi = [];
for (let i = 1; i <= 40; i++) {
    const rider = new Rider({
        name: faker.name.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number("+919#########"),
    });

    hi.push(rider.save());
}

Promise.all(hi)
    .then(data => console.log(data))
    .catch(err => {
        console.log(err);
    });
