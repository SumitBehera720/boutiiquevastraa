"use server";

import crypto from "crypto";
import { users, hashPassword, initDataStore } from "@/lib/data-store";
import { sendPasswordResetEmail } from "@/lib/services/email";

interface RequestResetInput {
  email: string;
}

interface ResetInput {
  email: string;
  token: string;
  password: string;
}

/**
 * Handle password reset request by generating a token and sending a reset email
 */
export async function requestPasswordResetAction(data: RequestResetInput) {
  const { email } = data;

  if (!email || !email.trim()) {
    return { success: false, error: "Please provide your email address." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await initDataStore();
    const user = await users.findByEmail(normalizedEmail);

    if (!user) {
      console.log(`[Password Reset Request] Email not found: ${normalizedEmail}. Returning generic success for safety.`);
      // Return success even if email is not found to prevent user enumeration
      return { 
        success: true, 
        message: "If the email is registered in our system, you will receive a password reset link shortly." 
      };
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    
    // Set expiry to 15 minutes from now
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Save token to user object
    await users.update(user.id, {
      resetToken: token,
      resetTokenExpires: expires,
    });

    // Construct reset URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const resetLink = `${siteUrl}/account/reset-password?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    // Send reset email
    await sendPasswordResetEmail(normalizedEmail, resetLink);

    return { 
      success: true, 
      message: "If the email is registered in our system, you will receive a password reset link shortly." 
    };
  } catch (error: any) {
    console.error("[Password Reset Action Error]:", error.message);
    return { 
      success: false, 
      error: "An error occurred while processing your request. Please try again later." 
    };
  }
}

/**
 * Reset password using email, token, and the new password
 */
export async function resetPasswordAction(data: ResetInput) {
  const { email, token, password } = data;

  if (!email || !token || !password) {
    return { success: false, error: "All fields are required." };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    await initDataStore();
    const user = await users.findByEmail(normalizedEmail);

    if (!user || !user.resetToken || user.resetToken !== token) {
      return { success: false, error: "Invalid or expired password reset request." };
    }

    // Verify token expiry
    if (user.resetTokenExpires) {
      const expiryDate = new Date(user.resetTokenExpires);
      if (expiryDate.getTime() < Date.now()) {
        return { success: false, error: "This password reset link has expired. Please request a new one." };
      }
    } else {
      return { success: false, error: "Invalid reset details." };
    }

    // Hash the password and save it, while clearing reset token fields
    const newPasswordHash = hashPassword(password);
    await users.update(user.id, {
      passwordHash: newPasswordHash,
      resetToken: null,
      resetTokenExpires: null,
    });

    console.log(`[Password Reset Success] Password reset for user: ${normalizedEmail}`);
    return { success: true };
  } catch (error: any) {
    console.error("[Password Reset Complete Error]:", error.message);
    return { 
      success: false, 
      error: "An error occurred while resetting your password. Please try again." 
    };
  }
}
