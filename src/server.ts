import dotenv from 'dotenv';
import { mongoConfig } from './config/mongo';
import { redisConfig } from './config/redis';
import app from './app';

dotenv.config();

mongoConfig();
redisConfig();

const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
