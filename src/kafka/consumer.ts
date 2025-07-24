import { Server } from 'socket.io';
import { kafka } from '../config/kafka';
import { sendMessage } from '../controllers/socket/messageSocketController';
import { sendNotification } from '../controllers/socket/notificationSocketController';
import { sendResponseAppend } from '../controllers/socket/genaiSocketController';
import { Kafka } from 'kafkajs';
import { KafkaTopics } from '../enums/kafkaEnums';
const consumer = kafka.consumer({ groupId: 'consumers-group' });

export const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: Object.values(KafkaTopics), fromBeginning: false });
};

export const setupConsumer = (io: Server) => async () => {
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value?.toString() || '{}');

      switch (topic) {
        case KafkaTopics.Messages:
          await sendMessage(io)(data);
          break;

        case KafkaTopics.Notifications:
          await sendNotification(io)(data);
          break;

        case KafkaTopics.Genai:
          await sendResponseAppend(io)(data);
          break;

        default:
          console.warn(`Received message from unknown topic: ${topic}`);
      }
    },
  });
};
