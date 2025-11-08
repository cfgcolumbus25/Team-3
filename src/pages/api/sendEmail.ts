import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

router.post("/sendEmail", async (req, res) => {
  const { alertId } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: "nithinbhandari7@gmail.com",
      subject: "CLEP Alert Update",
      text: `An update was made for alert ID: ${alertId}. Please review.`,
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ success: false });
  }
});

export default router;
