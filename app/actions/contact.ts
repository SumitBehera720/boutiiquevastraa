"use server";

import { sendContactFormEmail } from "@/lib/services/email";

interface ContactInput {
  name: string;
  email: string;
  message: string;
}

export async function submitContactFormAction(data: ContactInput) {
  const { name, email, message } = data;

  if (!name || !name.trim()) {
    return { success: false, error: "Your name is required." };
  }

  if (!email || !email.trim()) {
    return { success: false, error: "Email address is required." };
  }

  if (!message || !message.trim()) {
    return { success: false, error: "Message content is required." };
  }

  // Basic email syntax validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { success: false, error: "Please provide a valid email address." };
  }

  try {
    await sendContactFormEmail(name.trim(), email.trim(), message.trim());
    return { success: true };
  } catch (error: any) {
    console.error("[Contact Server Action Error]:", error.message);
    return { 
      success: false, 
      error: "We encountered an issue sending your message. Please try again later." 
    };
  }
}
