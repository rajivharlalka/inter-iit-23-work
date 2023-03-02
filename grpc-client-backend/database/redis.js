import config from "../config/config.js";
import redis from "redis";
const client = redis.createClient({url: config.redis});
(async () => {
    await client.connect();
    console.log("Connected to Redis");
})();

function getHashData(key, id) {
    return client.hGet(key, id);
}

function getAllHashData(key) {
    return client.hVals(key);
}

function setHashData(key, id, value) {
    return client.hSet(key, id, JSON.stringify(value));
}

function setGeoData(key, latitude, longitude, id) {
    return client.geoAdd(key, {latitude, longitude, member: id});
}

function removeZset(key, id) {
    return client.zRem(key, id);
}

function incId(key) {
    return client.incr(key);
}

function getStringData(key) {
    return client.get(key);
}

function geosearch(key, latitude, longitude) {
    return client.geoSearchWith(key, {latitude, longitude}, {radius: 50, unit: "km"}, ["WITHCOORD"], {SORT: "ASC"});
}
function setStringData(key, value) {
    return client.set(key, JSON.stringify(value));
}

const getPickupId = () => {
    return getStringData("pickup:id");
};

const setPickupData = async value => {
    const id = await incId("pickup:id");
    return setHashData("pickup:data", id, {...value, id});
};

const setHub = value => {
    return setStringData("hub:data", value);
};

const getHub = () => {
    return getStringData("hub:data");
};

const addGeoData = (coordinates, id) => {
    return setGeoData("package:coordinate", coordinates.latitude, coordinates.longitude, id);
};

const removeGeoData = id => {
    return removeZset("package:coordinate", id);
};

const getGeoLocations = coordinates => {
    return geosearch("package:coordinate", coordinates.latitude, coordinates.longitude);
};

const setRiderData = async (value, id) => {
    return setHashData("rider:data", id, {...value, id});
};

const updateRiderData = (id, value) => {
    return setHashData("rider:data", id, value);
};

const getRiderData = id => {
    return getHashData("rider:data", id);
};

const getAllRiderData = () => {
    return getAllHashData("rider:data");
};

const getWarehouse = () => {
    return getStringData("warehouse");
};

const checkScript = () => {
    return getStringData("script:power");
};

const setCheckScript = value => {
    return setStringData("script:power", value);
};
const getScriptTime = () => {
    return getStringData("script:time");
};

const saveScriptTime = time => {
    return setStringData("script:time", time);
};

const getScriptSpeed = () => {
    return getStringData("script:speed");
};

const saveScriptSpeed = value => {
    return setStringData("script:speed", value);
};

const getRiderMoved = value => {
    return getHashData("rider_moved:id", value);
};

const rider_time_remaining = value => {
    return getHashData("rider_time_remaining:id", value);
};

const setRiderMoved = (value, id) => {
    return setHashData("rider_moved:id", id, value);
};

const setRiderRem = (value, id) => {
    return setHashData("rider_time_remaining:id", id, value);
};

export default {
    getPickupId,
    setPickupData,
    setHub,
    getHub,
    addGeoData,
    removeGeoData,
    getGeoLocations,
    setRiderData,
    updateRiderData,
    getRiderData,
    getAllRiderData,
    getWarehouse,
    checkScript,
    getScriptTime,
    saveScriptTime,
    getScriptSpeed,
    saveScriptSpeed,
    getRiderData,
    getRiderMoved,
    rider_time_remaining,
    setRiderMoved,
    setRiderRem,
};
