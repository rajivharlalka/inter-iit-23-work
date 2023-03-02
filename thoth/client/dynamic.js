const grpc = require("@grpc/grpc-js");
const loader = require("@grpc/proto-loader");

const PROTO_PATH = __dirname + "/../proto/dynamic/dynamic.proto";
const packageDefinition = loader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
});
const proto = grpc.loadPackageDefinition(packageDefinition);

exports.createClient = () => {
    return new proto.dynamic.DynamicRouting("localhost:50051", grpc.credentials.createInsecure());
};
