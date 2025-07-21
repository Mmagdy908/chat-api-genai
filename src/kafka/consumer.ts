import { Server } from 'socket.io';
import { kafka } from '../config/kafka';
import { sendMessage } from '../controllers/socket/messageSocketController';
import { sendNotification } from '../controllers/socket/notificationSocketController';
const consumer = kafka.consumer({ groupId: 'consumers-group' });

export const connectConsumer = async () => {
  await consumer.connect();
  await consumer.subscribe({ topics: ['messages', 'notifications'], fromBeginning: false });
};

export const setupConsumer = (io: Server) => async () => {
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      const data = JSON.parse(message.value?.toString() || '{}');

      switch (topic) {
        case 'messages':
          await sendMessage(io)(data);
          break;

        case 'notifications':
          await sendNotification(io)(data);
          break;

        default:
          console.warn(`Received message from unknown topic: ${topic}`);
      }
    },
  });
};
