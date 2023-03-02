import mongoose, {Mongoose} from "mongoose";
const Schema = mongoose.Schema;

const binSchema = new Schema(
    {
        dimensions: {
            length: {type: Number, required: true},
            breadth: {type: Number, required: true},
            height: {type: Number, required: true},
            weight: {type: Number, required: true},
        },
        packages: [
            {
                package_id: {type: Schema.Types.ObjectId},
                length: {type: Number, required: true},
                breadth: {type: Number, required: true},
                height: {type: Number, required: true},
                x: {type: Number, required: true},
                y: {type: Number, required: true},
                z: {type: Number, required: true},
            },
        ],
    },
    {timestamps: true}
);

const Bin = mongoose.model("Bin", binSchema);
export default Bin;
