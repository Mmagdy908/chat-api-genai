import { Server, Socket } from 'socket.io';
import { kafka } from '../config/kafka';
import { sendMessage } from '../controllers/socket/messageSocketController';

const consumer = kafka.consumer({ groupId: 'message-consumers-group' });

export const messageConsumer = (io: Server) => async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'messages', fromBeginning: false });
  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        await sendMessage(io)(JSON.parse(message.value?.toString() as string));
        // console.log('Received: ', message.value?.toString());
      } catch (err) {
        console.error('Kafka message processing error:', err);
      }
    },
  });
};
