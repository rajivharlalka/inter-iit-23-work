import catchAsync from "../utils/catchAsync.js";
import rabbit from "../utils/rabbitmq.js";
import {getCoordinatesFromAddress} from "../utils/utility.js";

const startOptimiser = catchAsync(async (req, res) => {
    let {riders} = req.query;
    riders = Number(riders);
    if (!riders || riders <= 0) {
        riders = -1;
    }
    const channel = rabbit.getChannel();
    channel.sendToQueue("grpc", Buffer.from(JSON.stringify({message: "Optimiser", riders})));
    res.status(200).json({message: "Optimiser Started"});
});

const startDynamicPickup = catchAsync(async (req, res) => {
    const pkg = req.body;
    const {awb_id, sku_id, deliver_to, address, edd} = req.body;

    const {data} = await getCoordinatesFromAddress(address);

    if (data == undefined || data.results.length <= 0) {
        res.status(400).json({message: "Invalid Address"});
        return;
    }

    const channel = rabbit.getChannel();
    channel.sendToQueue("dynamic", Buffer.from(JSON.stringify({message: "Dynamic Pickup", pkg})));
    res.status(200).json({message: "Dynamic Pickup Started"});
});

export default {startOptimiser, startDynamicPickup};
