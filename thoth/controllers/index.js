import redis from "../database/redis.js";
import request from "../utils/request.js";
import dynamicClient from "../client/dynamic";

const addPickup = async (req, res) => {
    try {
        // store the new pickup in Redis
        await redis.setPickupData(req.body);
        const pickup_id = await redis.getPickupId();
        const pickup = req.body;
        pickup.id = pickup_id;

        // fetch data from Redis
        const nearby = await redis.getGeoLocations(pickup.location);
        redis.addGeoData(pickup.location, pickup.id);
        // const data = await redis.getData(req.body.key);

        let hub = JSON.parse(await redis.getHub());

        // merge the new pickup data with the rest of the data
        const reqs = request.createDynamicRequest(pickup, objects, hub);
        // call the gRPC service

        const client = dynamicClient.createClient();
        // const response = await client.RunDynamic(reqs);
        res.status(200).send(reqs);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};

const updateRider = async (req, res) => {
    try {
        const {id, location} = req.body;
        const rider = JSON.parse(await redis.getRiderData(id.toString()));
        rider.location = location;
        await redis.updateRiderData(rider.id, rider);
        res.status(200).json({message: "data updated"});
    } catch (err) {
        res.status(500).json({message: err.message, stack: err.stack});
    }
};

const setRider = async (req, res) => {
    await redis.setRiderData(req.body);
    res.status(200).json({message: "New Rider Added"});
};

const getRider = async (req, res) => {
    try {
        const rider = JSON.parse(await redis.getRiderData(req.query.id));
        res.status(200).json({rider});
    } catch (err) {
        res.status(500).json({message: err.message});
    }
};

const addHub = async (req, res) => {
    try {
        await redis.setHub(req.body);
        res.status(200).json({message: "hub location updated"});
    } catch (err) {
        console.log(err);
        res.status(500).json({err});
    }
};

const getHub = async (req, res) => {
    try {
        const hub = await redis.getHub();
        res.status(200).json({hub: JSON.parse(hub)});
    } catch (err) {
        console.log(err);
        res.status(500).json({err});
    }
};

function getPaths(objects) {}

export default {getHub, addHub, addPickup, updateRider, setRider, getRider};
