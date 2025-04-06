import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async ({ email, subject, resetpwdlink }) => {
  try {
  
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // Gmail works with `false` for 587
      auth: {
        user: process.env.EMAIL_USERNAME, // ✅ Corrected this line
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: subject || 'StaySafe - Password Reset Request',
      text: `
    Hello,
    
    We received a request to reset your password. If you made this request, you can reset your password by clicking the link below:
    
    ${resetpwdlink}
    
    If you did not request a password reset, please ignore this email.
    
    Thanks,
    The Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; color: #333;">
          <p>Hello,</p>
          <p>We received a request to reset your password. If you made this request, you can reset your password by clicking the button below:</p>
          <p>
            <a href="${resetpwdlink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 5px;">
              Reset Password
            </a>
          </p>
          <p>If the button doesn't work, copy and paste the following link into your browser:</p>
          <p><a href="${resetpwdlink}">${resetpwdlink}</a></p>
          <br/>
          <p>If you didn’t request this, you can safely ignore this email.</p>
          <p>Thanks,<br/>The Team</p>
        </div>
      `,
    };


    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(error.message || "Email could not be sent");
  }
};

export { sendEmail };
