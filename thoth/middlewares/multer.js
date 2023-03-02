import AWS from "aws-sdk";
import multer from "multer";
import multerS3 from "multer-s3";
import config from "../config/config.js";

AWS.config.update(config.awsKeys);

const s3 = new AWS.S3();

const uploadImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.privateBucket,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        // metadata: function (req, file, cb) {
        //     cb(null, {fieldName: file.fieldname});
        // },
        key: function (req, file, cb) {
            cb(null, "image/" + file.originalname);
        },
    }),
});

export default uploadImage;
