import { Kafka, KafkaConfig } from 'kafkajs';
import ENV_VAR from '../config/envConfig';

export const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [ENV_VAR.KAFKA_BROKER],
  sasl: {
    mechanism: ENV_VAR.KAFKA_MECHANISM,
    username: ENV_VAR.KAFKA_USERNAME,
    password: ENV_VAR.KAFKA_PASSWORD,
  },
  ssl: true,
} as KafkaConfig);
