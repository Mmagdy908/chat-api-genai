import { kafka } from '../config/kafka';
import { KafkaTopics } from '../enums/kafkaEnums';
import { SendGenaiRequest } from '../schemas/genaiSchemas';
import { SendGenaiMessageRequest, SendMessageRequest } from '../schemas/messageSchemas';
import { SendNotificationRequest } from '../schemas/notificationSchemas';

const producer = kafka.producer();

export const connectProducer = async () => {
  await producer.connect();
};

export const messageProducer = async (
  messageData: SendMessageRequest | SendGenaiMessageRequest
) => {
  await producer.send({
    topic: KafkaTopics.Messages,
    messages: [{ key: messageData.chat, value: JSON.stringify(messageData) }],
  });
};

export const notificationProducer = async (notificationData: SendNotificationRequest) => {
  await producer.send({
    topic: KafkaTopics.Notifications,
    messages: [{ value: JSON.stringify(notificationData) }],
  });
};

export const genaiProducer = async (genaiRequestData: SendGenaiRequest) => {
  await producer.send({
    topic: KafkaTopics.Genai,
    messages: [{ key: genaiRequestData.chatId, value: JSON.stringify(genaiRequestData) }],
  });
};
