import amqplib from "amqplib";
import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import config from "./config/config.js";
import mongoose from "mongoose";

import {writeDataToFile} from "./utils/utils.js";
import {getOptimizerRequest, updateDbOptimizerResponse} from "./utils/optimizerUtils.js";
import {getDynamicRequest, updateDbDynamicResponse} from "./utils/dynamicUtils.js";
import {getDeleteRequest, updateDbDeleteResponse} from "./utils/deleteUtils.js";

const OPTIMIZER_PROTO_FILE = "./proto/optimizer.proto";
const DYNAMIC_PROTO_FILE = "./proto/dynamic.proto";

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const optimizerPkgDefs = protoLoader.loadSync(OPTIMIZER_PROTO_FILE, options);
const optimizerService = grpc.loadPackageDefinition(optimizerPkgDefs).optimizer;
const optimizerClient = new optimizerService.optimizer(config.optimizerServer, grpc.credentials.createInsecure());

const dynamicPkgDefs = protoLoader.loadSync(DYNAMIC_PROTO_FILE, options);
const dynamicService = grpc.loadPackageDefinition(dynamicPkgDefs).dynamic;
const dynamicClient = new dynamicService.DynamicRouting(config.dynamicServer, grpc.credentials.createInsecure());

mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

async function connect() {
    try {
        const amqpServer = config.rabbitmq;
        const connection = await amqplib.connect(amqpServer);
        const channel = await connection.createChannel();

        await channel.assertQueue("grpc");
        await channel.assertQueue("dynamic");
        await channel.assertQueue("delete");

        channel.prefetch(1);
        // consume all the orders that are not acknowledged
        await channel.consume("grpc", async data => {
            console.log(`Received ${Buffer.from(data.content)}`);

            const {riders} = JSON.parse(data.content);

            const {optimizerRequest, idmap} = await getOptimizerRequest(riders);
            writeDataToFile(idmap, `latestidmap-${new Date().toLocaleTimeString()}`);
            writeDataToFile(optimizerRequest, `latestoptimizerReq-${new Date().toLocaleTimeString()}`);
            channel.ack(data);

            // console.log(optimizerRequest);

            // if (optimizerRequest.packages.length === 0) {
            //     return;
            // }
            // try {
            //     optimizerClient.startService(
            //         optimizerRequest,
            //         {deadline: new Date().setSeconds(new Date().getSeconds() + 1000)},
            //         async (err, response) => {
            //             console.log(response);
            //             writeDataToFile(response, `latestoptimizerRes-${new Date().toLocaleTimeString()}}`);
            //             console.log(err);
            //             await updateDbOptimizerResponse(response, idmap);
            //             channel.ack(data);
            //         }
            //     );
            // } catch (error) {
            //     console.log(error);
            //     channel.ack(data);
            // }
        });

        await channel.consume("dynamic", async data => {
            console.log(`Recieved ${Buffer.from(data.content)}`);
            const {pkg} = JSON.parse(data.content);
            console.log(pkg);

            const {dynamicRequest, pkgIdmap, riderIdmap} = await getDynamicRequest(pkg);
            channel.ack(data);

            // writeDataToFile(pkgIdmap, `dynamicPkgId-${new Date().toLocaleTimeString()}}`);
            // writeDataToFile(riderIdmap, `dynamicRiderId-${new Date().toLocaleTimeString()}}`);
            // writeDataToFile(dynamicRequest, `dynamicReq-${new Date().toLocaleTimeString()}}`);
            // console.log(dynamicRequest);

            // dynamicClient.RunDynamic(dynamicRequest, async (err, response) => {
            //     console.log(response);
            //     writeDataToFile(response, `dynamicRes-${new Date().toLocaleTimeString()}}`);
            //     console.log(err);
            //     await updateDbDynamicResponse(response, pkgIdmap, riderIdmap);
            // });
        });

        await channel.consume("delete", async data => {
            console.log(`Recieved ${Buffer.from(data.content)}`);
            const req = JSON.parse(data.content);

            const {deleteRequest, idmap} = await getDeleteRequest(req.message.package_id, req.message.route_id);
            channel.ack(data);

            // writeDataToFile(idmap, `deletePkgId-${new Date().toLocaleTimeString()}}`);
            // writeDataToFile(deleteRequest, `deleteReq-${new Date().toLocaleTimeString()}}`);
            // console.log(deleteRequest);

            // dynamicClient.DeleteDynamic(deleteRequest, async (err, response) => {
            //     console.log(response);
            //     writeDataToFile(response, `deleteRes-${new Date().toLocaleTimeString()}}`);
            //     console.log(err);
            //     await updateDbDeleteResponse(response, idmap, req.message.route_id);
            // });
        });
    } catch (error) {
        console.log(error);
    }
}

connect();
