import mongoose from "mongoose";
const Schema = mongoose.Schema;

const packageSchema = new Schema(
    {
        image_url: {type: String},
        sku_id: {type: String, index: true},
        awb_id: {type: String, index: true},

        deliver_to: {name: {type: String}, phone_number: {type: String}},

        coordinates: {
            latitude: {type: Number},
            longitude: {type: Number},
            address: {type: String},
        },
        dimensions: {
            length: {type: Number, default: 0},
            breadth: {type: Number, default: 0},
            height: {type: Number, default: 0},
            weight: {type: Number, default: 0},
        },
        delivered_time: {type: Date},
        type: {type: String, enum: ["DELIVERY", "PICKUP"]},
        latest_status: {type: String, default: "IN WAREHOUSE"},
        threat: {type: Number, default: 0},
        edd: {type: Number},
    },
    {timestamps: true}
);

const Package = mongoose.model("Package", packageSchema);
export default Package;

/* 
- rider_id - 
- route_id
- package_id
*/

//TODO: change deliver_to,deliver_time name
/*
Wrapper to change format of returned package based on address
[{
    packages:[{package_item}]
    location:{
        latitude:
        longitude:
        address:
    }
}]
*/
