import nodemailer from 'nodemailer';
import { User } from '../interfaces/models/user';
import { generateResetPasswordEmailTemplate, generateVerifyEmailTemplate } from './emailTemplate';

// export default async (email: string, subject: string, html: string) => {
//   // 1) create transport
//   const transport = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: Number(process.env.EMAIL_PORT),
//     auth: {
//       user: process.env.EMAIL_USERNAME,
//       pass: process.env.EMAIL_PASSWORD,
//     },
//   });

//   // 2) create mail options
//   const mailOptions = {
//     from: 'Todo List API <admin@todo.io>',
//     to: email,
//     subject: subject,
//     html,
//   };

//   // 3) send mail

//   await transport.sendMail(mailOptions);
// };

// import htmlToText from 'html-to-text';

export default class Email {
  firstName: string;
  to: string;
  from: string;
  otp: string;

  constructor(user: User, otp: string) {
    this.firstName = user.firstName;
    this.to = user.email;
    this.from = `lisapa8846@dlbazi.com`;
    this.otp = otp;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template: string, subject: string) {
    // 1) render template
    // const html = pug.renderFile(`${__dirname}/../views/emails/${template}.pug`, {
    //   firstName: this.firstName,
    //   url: this.url,
    //   subject,
    // });

    // 2) create mail options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: template,
      // text: htmlToText.convert(html),
    };

    // 3) send mail
    await this.newTransport().sendMail(mailOptions);
  }

  async sendVerificationEmail() {
    await this.send(generateVerifyEmailTemplate(this.otp), 'Welcome To our Chat App!');
  }

  async sendResetPasswordEmail() {
    await this.send(
      generateResetPasswordEmailTemplate(this.otp),
      'Reset Password Token (valid for 10 mins)'
    );
  }
}
