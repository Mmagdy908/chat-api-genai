export const generateResetPasswordEmailTemplate = (resetOTP: string): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #333;
        }
        p {
          font-size: 16px;
          color: #555;
        }
        .btn {
          display: inline-block;
          padding: 12px 25px;
          background-color: #007BFF;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Password Reset Request</h1>
        <p>We received a request to reset your account password. Here the OTP to reset password:</p>
        ${resetOTP}
        <p class="footer">If you did not request a password reset, please ignore this email.</p>
      </div>
    </body>
    </html>
  `;

export const generateVerifyEmailTemplate = (verifyOTP: string): string => `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        h1 {
          color: #2c3e50;
        }
        p {
          font-size: 16px;
          color: #555;
        }
        .btn {
          display: inline-block;
          padding: 12px 25px;
          background-color: #27ae60;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification</h1>
        <p>Thank you for registering with us! Please enter the otp below to verify your email address:</p>
        ${verifyOTP}
        <p class="footer">If you didn't create an account, no further action is required.</p>
      </div>
    </body>
    </html>
  `;
