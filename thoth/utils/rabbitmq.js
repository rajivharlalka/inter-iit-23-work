import amqplib from "amqplib";
import config from "../config/config.js";

class Rabbitmq {
    async connect() {
        try {
            // rabbitmq default port is 5672
            const amqpServer = config.rabbitmq;
            const connection = await amqplib.connect(amqpServer);
            this.channel = await connection.createChannel();
            // make sure that the order channel is created, if not this statement will create it
            await this.channel.assertQueue("grpc");
            await this.channel.assertQueue("dynamic");
            await this.channel.assertQueue("delete");
        } catch (error) {
            console.log(error);
        }
    }

    getChannel() {
        return this.channel;
    }
}

const rabbit = new Rabbitmq();
export default rabbit;
