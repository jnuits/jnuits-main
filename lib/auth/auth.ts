import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { admin, customSession, twoFactor } from 'better-auth/plugins'

import prisma from '../prismadb'
import transporter from '../sendmail'

interface CustomUser {
  id: string
  email: string
  name: string
  image?: string | null
  role?: string
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),

  // NOTE: session configuration with cookie caching
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 10 * 60,
    },
  },

  //NOTE: login method

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,

    // NOTE: reset password email configuration
    async sendResetPassword({ user, url }) {
      const mailOptions = {
        from: `"JnU IT Society" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: 'Reset Your Password - JnUIts',
        html: `
  <div style="background-color: #f9fafb; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
      
      <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">JnU IT Society</h1>
      </div>

      <div style="padding: 40px 30px;">
        <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #111827;">Reset Your Password</h2>
        <p style="margin: 0 0 24px; font-size: 16px; line-height: 24px; color: #4b5563;">
          Hi <strong>${user.name}</strong>, <br/>
          We received a request to reset the password for your account. No changes have been made yet.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${url}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.2s;">
            Reset Password
          </a>
        </div>

        <p style="margin: 24px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
          If you did not request a password reset, please ignore this email or contact support if you have questions.
        </p>
      </div>

      <div style="padding: 24px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
        <p style="margin: 0 0 12px; font-size: 12px; color: #9ca3af; line-height: 18px;">
          If the button above doesn't work, copy and paste this URL into your browser:
          <br/>
          <span style="color: #4f46e5; word-break: break-all;">${url}</span>
        </p>
        <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 500;">
          &copy; 2026 JnU IT Society Team. All rights reserved.
        </p>
      </div>
    </div>
  </div>
`,
      }
      try {
        await transporter.sendMail(mailOptions)
        console.log(`✅ Reset password email sent to ${user.email}`)
      } catch (error) {
        console.error('❌ Error sending reset password email:', error)
      }
    },
  },

  // NOTE: additional fields for user model
  user: {
    additionalFields: {
      studentId: {
        type: 'string',
        input: true,
        required: true,
      },
      department: {
        type: 'string',
        input: true,
        required: true,
      },
      phoneNumber: {
        type: 'string',
        input: true,
        required: true,
      },
      batch: {
        type: 'string',
        input: true,
        required: true,
      },

      gender: {
        type: 'string',
        input: true,
        required: true,
      },
      role: {
        type: 'string',
        defaultValue: 'USER',
        input: false,
      },
    },
  },

  // NOTE: email verification configuration
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const mailOptions = {
        from: `"JnU it Society" <${process.env.SMTP_EMAIL}>`,
        to: user.email,
        subject: 'Email Verification - Verify Your Account',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
            <h2 style="color: #4F46E5; text-align: center;">Verify Your Email</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Welcome to our JnU IT Society! To complete your registration and ensure security, please verify your email address by clicking the button below:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #666; line-height: 1.5;">This link will expire soon. If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #f0f0f0; margin: 20px 0;">
            <p style="font-size: 11px; color: #999; text-align: center;">© 2026 JnU IT Society Team</p>
          </div>
        `,
      }

      try {
        await transporter.sendMail(mailOptions)
        console.log(`✅ Verification email sent to ${user.email}`)
      } catch (error) {
        console.error('❌ Error sending email:', error)
      }
    },
  },

  // NOTE: 2FA configuration
  plugins: [
    admin({
      adminRole: 'SUPER_ADMIN',
      defaultRole: 'USER',
    }),
    twoFactor({
      issuer: 'JnUIts',
      otpOptions: {
        sendOTP: async ({ user, otp }) => {
          try {
            await transporter.sendMail({
              from: `"JnU IT Society" <${process.env.SMTP_EMAIL}>`,
              to: user.email,
              subject: 'Your Verification Code - JnUIts',
              html: `
            <div style="font-family: sans-serif; text-align: center; padding: 20px;">
              <h2>Security Verification</h2>
              <p>Your one-time password (OTP) is:</p>
              <h1 style="letter-spacing: 5px; color: #4F46E5;">${otp}</h1>
              <p>This code will expire in 10 minutes.</p>
            </div>
          `,
            })
            console.log(`✅ OTP sent successfully to ${user.email}`)
          } catch (error) {
            console.error('❌ Nodemailer Error:', error)
          }
        },
      },
    }),

    customSession(async ({ user, session }) => {
      const u = user as CustomUser
      return {
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          image: u.image,
          role: u.role,
        },
        session,
      }
    }),
  ],
})
