import { genaiProducer } from '../kafka/producer';
import { GoogleGenAI, ContentListUnion } from '@google/genai';
import ENV_VAR from '../config/envConfig';

export const generateGenaiResponse = async (prompt: {
  text?: string;
  mediaUrl?: string;
  chatId: string;
  messageId: string;
  genaiStreaming: boolean;
}) => {
  // await genaiProducer(prompt);
  try {
    // 1) preparing contents
    const contents: ContentListUnion = [{ text: prompt.text }];
    // attaching media
    if (prompt.mediaUrl) {
      const fileResponse = await fetch(prompt.mediaUrl);
      const fileArrayBuffer = await fileResponse.arrayBuffer();
      const base64FileData = Buffer.from(fileArrayBuffer).toString('base64');
      contents.push({
        inlineData: {
          mimeType: fileResponse.headers.get('content-type') as string,
          data: base64FileData,
        },
      });
    }

    const ai = new GoogleGenAI({});

    if (prompt.genaiStreaming) {
      const response = await ai.models.generateContentStream({
        model: ENV_VAR.GENAI_MODEL,
        contents,
        config: {
          thinkingConfig: {
            // Turn on dynamic thinking:
            thinkingBudget: -1,
          },
        },
      });

      for await (const chunk of response) {
        await genaiProducer({
          chatId: prompt.chatId,
          messageId: prompt.messageId,
          append: chunk.text || '',
          done: false,
        });
      }

      await genaiProducer({
        chatId: prompt.chatId,
        messageId: prompt.messageId,
        append: '',
        done: true,
      });
    } else {
      const result = await ai.models.generateContent({
        model: ENV_VAR.GENAI_MODEL,
        contents,
        config: {
          thinkingConfig: {
            // Turn on dynamic thinking:
            thinkingBudget: -1,
          },
        },
      });

      await genaiProducer({
        chatId: prompt.chatId,
        messageId: prompt.messageId,
        append: result.text || '',
        done: true,
      });
    }
  } catch (err) {
    throw { error: err, messageId: prompt.messageId };
  }
};
