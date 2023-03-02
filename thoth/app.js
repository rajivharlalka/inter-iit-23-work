import express from "express";
import helmet from "helmet";
import xss from "xss-clean";
import cors from "cors";
import httpStatus from "http-status";
import config from "./config/config.js";
import morgan from "./config/morgan.js";
import routes from "./routes/index.js";
import {errorConverter, errorHandler} from "./middlewares/error.js";
import ApiError from "./utils/ApiError.js";

const app = express();

if (config.env !== "test") {
    app.use(morgan.successHandler);
    app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({extended: true}));

// sanitize request data
app.use(xss());

// enable cors
app.use(cors());
app.options("*", cors());

// v1 api routes
app.use("/v1", routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
    next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
