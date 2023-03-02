import grpc from "@grpc/grpc-js";
import protoLoader from "@grpc/proto-loader";
import config from "./config/config.js";
import mongoose from "mongoose";
import Route from "./models/route.js";
import Package from "./models/package.js";
mongoose.set("strictQuery", false);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(async () => {
    console.log("Connected to MongoDB");
});

import {writeDataToFile} from "./utils/utils.js";
const DYNAMIC_PROTO_FILE = "./proto/dynamic.proto";

const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
};

const dynamicPkgDefs = protoLoader.loadSync(DYNAMIC_PROTO_FILE, options);
const dynamicService = grpc.loadPackageDefinition(dynamicPkgDefs).dynamic;
const dynamicClient = new dynamicService.DynamicRouting(config.dynamicServer, grpc.credentials.createInsecure());

const createSimulateRequest(route){
    let pkgIdmap={};
    let riderIdmap={};
    let pkgStringmap={};

    let i=1;
    for (const pkg of route.packages){
        pkgIdmap[pkg._id]=i;
        pkgStringmap[i]=pkg._id;
        i++;
    }
}

async function main() {
    try {
        const routes = await Route.find({}).populate("paths").lean();

        for (const route of routes) {
            const new_path = [];
            for (const path of route.paths) {
                if (path.latest_status !== "DELIVERED") {
                    new_path.push(path);
                }
            }
            route.paths = new_path;
        }

        

        for await (const route of routes) {
            dynamicClient.Simulate(SimulateRequest);
        }

        console.log(routes);
    } catch (err) {
        console.log(err);
    }
}

main();
