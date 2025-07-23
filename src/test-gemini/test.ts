import { GoogleGenAI, createUserContent, createPartFromUri, ApiError } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config({ path: `${__dirname}/.env.local` });

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

// ### simple with dynamic think

// async function main() {
//   const response = await ai.models.generateContent({
//     model: 'gemini-2.5-pro',
//     contents: 'Provide a list of 3 famous physicists and their key contributions',
//     config: {
//       thinkingConfig: {
//         // Turn on dynamic thinking:
//         thinkingBudget: -1,
//       },
//     },
//   });
//   console.log(response.text);
// }

const prompt = `Explaine briefly in 20 steps how to solve tower of hanoi problem.`;
// const prompt = `Alice, Bob, and Carol each live in a different house on the same
// street: red, green, and blue. The person who lives in the red house owns a cat.
// Bob does not live in the green house. Carol owns a dog. The green house is to
// the left of the red house. Alice does not own a cat. Who lives in each house,
// and what pet do they own?`;

let thoughts = '';
let answer = '';

// async function main() {
//   const response = await ai.models.generateContentStream({
//     model: 'gemini-2.5-pro',
//     contents: prompt,
//     config: {
//       thinkingConfig: {
//         // includeThoughts: true,
//       },
//     },
//   });

//   for await (const chunk of response) {
//     for (const part of chunk.candidates![0].content!.parts!) {
//       if (!part.text) {
//         continue;
//       } else if (part.thought) {
//         if (!thoughts) {
//           console.log('Thoughts summary:');
//         }
//         console.log(part.text);
//         thoughts = thoughts + part.text;
//       } else {
//         if (!answer) {
//           console.log('Answer:');
//         }
//         console.log(part.text);
//         answer = answer + part.text;
//       }
//     }
//   }
// }

// ###  with dynamic think and streaming

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

// ###  with multimedia (image, pdf, video)

// async function main() {
//   try {
//     const fileUrl =
//       'https://res.cloudinary.com/dqwk3uad1/image/upload/v1753253531/resume_e619t9.pdf';

//     const response = await fetch(fileUrl);
//     const fileArrayBuffer = await response.arrayBuffer();
//     const base64FileData = Buffer.from(fileArrayBuffer).toString('base64');

//     const result = await ai.models.generateContent({
//       model: 'gemini-2.5-flash',
//       contents: [
//         {
//           inlineData: {
//             mimeType: response.headers.get('content-type') as string,
//             data: base64FileData,
//           },
//         },
//         { text: 'what do u think about this roadmap' },
//       ],
//     });

//     console.log(result.text);
//   } catch (err) {
//     console.log(err);
//   }
// }

async function main() {
  try {
    const fileUrl =
      'https://res.cloudinary.com/dqwk3uad1/video/upload/v1753256288/Facebook_2_otjyn7.mp4';

    const response = await fetch(fileUrl);
    const fileArrayBuffer = await response.arrayBuffer();
    const base64FileData = Buffer.from(fileArrayBuffer).toString('base64');

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        // {
        //   inlineData: {
        //     mimeType: response.headers.get('content-type') as string,
        //     data: base64FileData,
        //   },
        // },
        { text: 'احكي عن قصة نجاح ملهمة' },
      ],
    });

    console.log(result.text);
  } catch (err) {
    console.log(err);
  }
}
main();
