import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async ({ email, subject, message }) => {
  try {
    console.log("Sending email to:", email);

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
      subject: subject,
      text: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.response);
  } catch (error) {
    console.error("Email sending failed:", error);
    throw new Error(error.message || "Email could not be sent");
  }
};

export { sendEmail };
