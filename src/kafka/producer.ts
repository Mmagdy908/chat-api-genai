import { kafka } from '../config/kafka';
import { SendMessageRequest } from '../schemas/messageSchemas';
import { SendNotificationRequest } from '../schemas/notificationSchemas';

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const messageProducer = async (messageData: SendMessageRequest) => {
  await producer.send({
    topic: 'messages',
    messages: [{ key: messageData.chat, value: JSON.stringify(messageData) }],
  });
};

export const notificationProducer = async (notificationData: SendNotificationRequest) => {
  await producer.send({
    topic: 'notifications',
    messages: [{ value: JSON.stringify(notificationData) }],
  });
};
