import Stripe from "stripe";
import Razorpay from "razorpay";
import { TryCatch } from "../middlewares/error.js";
import { config } from "dotenv";
import paypal from "paypal-rest-sdk";
import ErrorHandler from "../utils/errorHandler.js";
import crypto from "crypto";
config(); // Load environment variables

// Stripe instance
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZOR_ID,
  key_secret: process.env.RAZOR_SECRET,
});

// PayPal instance configuration
paypal.configure({
  mode: "sandbox", // sandbox or live
  client_id: process.env.PAYPAL_Client_ID,
  client_secret: process.env.PAYPAL_Secret_key,
});

// Create Stripe Payment Intent
const createPayment = TryCatch(async (req, res, next) => {
  const { gateway, room, amount, currency } = req.body;
  console.log(gateway, room, amount, currency);
  // Validate required fields
  if (!gateway || !room || !amount) {
    return next(new ErrorHandler(400, "Missing required payment details"));
  }

  switch (gateway) {
    case "stripe": {
      // Call your createStripePayment logic
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: currency || "usd",
              product_data: {
                name: "Booking for Room",
              },
              unit_amount: amount * 100,
            },
            quantity: 1,
          },
        ],
        metadata: {
          buyerId: req.user._id.toString(),
          roomId: room.toString(),
        },
      });
      // Save your payment record if needed...
      return res.status(200).json({
        success: true,
        sessionId: stripeSession.id,
        redirectUrl: stripeSession.url,
      });
    }

    case "razorpay": {
      // Create a Razorpay order
      const options = {
        amount: Math.round(amount * 100), // in paisa
        currency: currency || "INR",
        receipt: room,
      };
      const razorpayOrder = await razorpay.orders.create(options);
      console.log(razorpayOrder);
      return res.status(200).json({
        success: true,
        orderId: razorpayOrder.id,
      });
    }

    case "paypal": {
      // Create a PayPal payment
      const paymentJson = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        redirect_urls: {
          return_url: `${process.env.BASE_URL}/payment/paypal/success`,
          cancel_url: `${process.env.BASE_URL}/payment/paypal/cancel`,
        },
        transactions: [
          {
            amount: {
              currency: currency || "USD",
              total: amount.toString(),
            },
            description: "Payment description",
          },
        ],
      };
      paypal.payment.create(paymentJson, function (error, payment) {
        if (error) {
          return next(new ErrorHandler(500, error.response));
        } else {
          let approvalUrl = "";
          payment.links.forEach((link) => {
            if (link.rel === "approval_url") {
              approvalUrl = link.href;
            }
          });
          if (approvalUrl) {
            return res.status(200).json({
              success: true,
              redirectUrl: approvalUrl,
            });
          } else {
            return next(new ErrorHandler(500, "Approval URL not found"));
          }
        }
      });
      break;
    }

    default:
      return next(new ErrorHandler(400, "Unsupported payment gateway"));
  }
});

// Create Razorpay Payment Order
const createRazorpayPayment = TryCatch(async (req, res, next) => {
  const { amount, currency, receipt } = req.body; // amount in rupees
  if (!amount) {
    return next(new ErrorHandler(400, "Amount is required"));
  }
  // Convert rupees to paisa
  const options = {
    amount: amount * 100,
    currency: currency || "INR",
    receipt: receipt || "receipt#1",
  };
  const payment = await razorpay.orders.create(options);
  res.status(200).json({
    success: true,
    payment,
  });
});

// Create PayPal Payment
const createPayPalPayment = TryCatch(async (req, res, next) => {
  const { amount, currency, description } = req.body; // amount in USD
  console.log(amount, currency, description);

  if (!amount) {
    return next(new ErrorHandler(400, "Amount is required"));
  }

  const paymentJson = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: `${process.env.BASE_URL}/payment/paypal/success`,
      cancel_url: `${process.env.BASE_URL}/payment/paypal/cancel`,
    },
    transactions: [
      {
        amount: {
          currency: currency || "USD",
          total: amount.toString(),
        },
        description: description || "Payment description",
      },
    ],
  };
  console.log("Payment JSON:", paymentJson);

  paypal.payment.create(paymentJson, function (error, payment) {
    if (error) {
      console.error("PayPal Payment Creation Error:", error);
      return next(new ErrorHandler(500, error.response));
    } else {
      // Look for the approval URL in the payment links array
      let approvalUrl = "";
      payment.links.forEach((link) => {
        if (link.rel === "approval_url") {
          approvalUrl = link.href;
        }
      });
      if (approvalUrl) {
        return res.status(200).json({
          success: true,
          approvalUrl,
        });
      } else {
        return next(
          new ErrorHandler(500, "Approval URL not found in PayPal response")
        );
      }
    }
  });
});

// verify section
const verifyRazorpayPayment = TryCatch(async (req, res, next) => {
  const { orderId, paymentId, signature } = req.body;
  console.log(orderId, paymentId, signature);
  if (!orderId || !paymentId || !signature) {
    return next(
      new ErrorHandler(400, "Missing required fields for verification")
    );
  }

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZOR_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expectedSignature === signature) {
    console.log("Razorpay Payment Verification Success");
    return res.status(200).json({ success: true, message: "Payment verified" });
  } else {
    console.log("Razorpay Payment Verification Failed");
    return next(new ErrorHandler(400, "Payment verification failed"));
  }
});

const verifyPaymentSuccess = TryCatch(async (req, res, next) => {
  const { paymentId, PayerID } = req.query;

  if (!paymentId || !PayerID) {
    return next(new ErrorHandler(400, "Payment ID and Payer ID are required"));
  }
  const execute_payment_json = {
    payer_id: PayerID,
  };
  paypal.payment.execute(
    paymentId,
    execute_payment_json,
    function (error, payment) {
      if (error) {
        console.error("PayPal Payment Execution Error:", error);
        return next(new ErrorHandler(500, error.response));
      } else {
        console.log("Get Payment Response");
        console.log(JSON.stringify(payment));
        return res.status(200).json({
          success: true,
          payment,
        });
      }
    }
  );
});

const verifyPaymentCancel = TryCatch(async (req, res) => {
  console.log("Payment Cancelled");
  res.status(200).json({ success: true, message: "Payment cancelled" });
});

export {
  createPayment,
  createRazorpayPayment,
  createPayPalPayment,
  verifyPaymentSuccess,
  verifyPaymentCancel,
  verifyRazorpayPayment,
};
