import { NextRequest, NextResponse } from 'next/server'
import { generateOtp, signOtpToken } from '@/lib/otp'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json() as { email: string }
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }

    const otp = generateOtp()
    const token = signOtpToken(email, otp)

    // Send email via Resend
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM ?? 'MacroDay <onboarding@resend.dev>',
          to: email,
          subject: `Your MacroDay login code: ${otp}`,
          html: `
            <div style="font-family:system-ui,sans-serif;max-width:400px;margin:0 auto;padding:32px">
              <div style="background:linear-gradient(135deg,#0F9E75,#0BD68A);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
                <span style="font-size:32px">⚡</span>
                <h1 style="color:white;font-size:20px;margin:8px 0 0">MacroDay</h1>
              </div>
              <p style="color:#374151;font-size:16px">Your login code:</p>
              <div style="background:#F3F4F6;border-radius:12px;padding:24px;text-align:center;margin:16px 0">
                <span style="font-size:40px;font-weight:bold;letter-spacing:8px;color:#111827">${otp}</span>
              </div>
              <p style="color:#6B7280;font-size:14px">Valid for 10 minutes. Do not share this code.</p>
            </div>
          `,
        }),
      })
    }

    // In dev mode (no Resend key), log the OTP so dev can use it
    if (!resendKey) {
      console.log(`[DEV] OTP for ${email}: ${otp}`)
    }

    return NextResponse.json({ token })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
