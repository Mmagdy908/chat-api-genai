import { mongoConfig } from './config/mongo';
import { redisConfig } from './config/redis';
import app from './app';
import ENV_VAR from './config/envConfig';

mongoConfig();
redisConfig();

const port = ENV_VAR.PORT || 3000;

app.listen(port, () => console.log(`Server is running on port ${port}`));
