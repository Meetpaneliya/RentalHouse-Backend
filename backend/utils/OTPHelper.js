import otpGenerator from "otp-generator";
import { sendEmail } from "./sendEmail.js";

const otpStore = new Map();

const sendOTP = async (email) => {
  const otp = otpGenerator.generate(4, {
    upperCaseAlphabets: false,
    specialChars: false,
    lowerCaseAlphabets: false,
    symbols: false,
    alphabets: false,
    digits: true,
    numbers: true,
    length: 4,
  });
  otpStore.set(email, { otp, expiresAt: Date.now() + 10 * 60 * 1000 }); // 10 minutes expiry

  await sendEmail({
    email,
    subject: "StaySafe - Email Verification OTP",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 10px; border: 1px solid #eee;">
        <h2 style="color: #2c3e50;">Welcome to <span style="color: #3498db;">StaySafe Rentals</span>!</h2>
        <p style="font-size: 16px; color: #555;">
          Thank you for choosing <strong>StaySafe</strong> – your trusted platform for safe and comfortable rental stays.
        </p>
        <p style="font-size: 16px; color: #555;">
          To complete your sign-up process, please use the OTP (One-Time Password) below to verify your email address:
        </p>
        <div style="margin: 20px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: bold; color: #27ae60;">${otp}</span>
        </div>
        <p style="font-size: 15px; color: #999;">
          This OTP is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        <p style="margin-top: 30px; font-size: 14px; color: #aaa;">
          If you did not request this, please ignore this email.
        </p>
        <p style="font-size: 14px; color: #aaa;">
          Stay safe,<br/>
          <strong>StaySafe Team</strong>
        </p>
      </div>
    `,
  });
  
};

const verifyOTP = (email, enteredOTP) => {
  const storedOtp = otpStore.get(email);
  console.log(storedOtp);
  if (!storedOtp) return false;
  if (storedOtp.expiresAt < Date.now()) {
    otpStore.delete(email);
    return false;
  }
  if (storedOtp.otp !== enteredOTP) return false;
  
  if (storedOtp.otp === enteredOTP) {
    otpStore.delete(email);
    return true;
  }
  return false;
};

export { sendOTP, verifyOTP };
