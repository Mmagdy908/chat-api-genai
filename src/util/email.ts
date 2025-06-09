import nodemailer from 'nodemailer';

export default async (email: string, subject: string, html: string) => {
  // 1) create transport
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  // 2) create mail options
  const mailOptions = {
    from: 'Todo List API <admin@todo.io>',
    to: email,
    subject: subject,
    html,
  };

  // 3) send mail

  await transport.sendMail(mailOptions);
};
