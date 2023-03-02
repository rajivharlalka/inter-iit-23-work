import mongoose from "mongoose";
const Schema = mongoose.Schema;

const notifSchema = new Schema(
    {
        message: {type: String},
        route_id: {type: String},
        status_warehouse: {type: String},
        status_rider: {type: String},
    },
    {timestamps: true}
);

const Notif = mongoose.model("Notif", notifSchema);
export default Notif;
