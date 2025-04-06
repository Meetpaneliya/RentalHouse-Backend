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
    subject: "Don't share your OTP with anyone",
    message: `Your OTP is ${otp}`,
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
