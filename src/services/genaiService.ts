import { genaiProducer } from '../kafka/producer';
import { GoogleGenAI, ContentListUnion } from '@google/genai';

export const generateGenaiResponse = async (prompt: {
  text?: string;
  mediaUrl?: string;
  chatId: string;
  messageId: string;
  genaiStreaming: boolean;
}) => {
  // await genaiProducer(prompt);

  // 1) preparing contents
  const contents: ContentListUnion = [{ text: prompt.text }];
  console.log('Prompt: ', prompt);
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
};

// async function main() {
//   const response = await ai.models.generateContentStream({
//     model: 'gemini-2.5-flash',
//     contents: prompt,
//     config: {
//       thinkingConfig: {
//         // Turn on dynamic thinking:
//         thinkingBudget: -1,
//       },
//     },
//   });

//   for await (const chunk of response) {
//     console.log(chunk.text);
//   }
// }

// const fileUrl =
//       'https://res.cloudinary.com/dqwk3uad1/video/upload/v1753256288/Facebook_2_otjyn7.mp4';

//     const response = await fetch(fileUrl);
//     const fileArrayBuffer = await response.arrayBuffer();
//     const base64FileData = Buffer.from(fileArrayBuffer).toString('base64');

//     const result = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: [
//         // {
//         //   inlineData: {
//         //     mimeType: response.headers.get('content-type') as string,
//         //     data: base64FileData,
//         //   },
//         // },
//         { text: 'احكي عن قصة نجاح ملهمة' },
//       ],
//     });

//     console.log(result.text);
