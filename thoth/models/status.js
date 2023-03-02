import mongoose from "mongoose";
const Schema = mongoose.Schema;

const statusSchema = new Schema(
    {
        status: {
            type: String,
            enum: [
                "IN WAREHOUSE",
                "ERRONEUS",
                "SCANNING",
                "FORMING CLUSTER",
                "RIDER ASSIGNED",
                "PICKED",
                "DELIVERED",
                "FAKE ATTEMPT",
            ],
            default: "IN WAREHOUSE",
        },
        package_id: {type: Schema.Types.ObjectId, ref: "Package", index: true},
    },
    {timestamps: true}
);

const Status = mongoose.model("Status", statusSchema);
export default Status;
