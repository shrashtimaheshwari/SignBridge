import emailjs from '@emailjs/browser'

export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function sendOTPEmail(toEmail, otpCode) {
  const templateParams = {
    to_email: toEmail,
    otp_code: otpCode,
    user_email: toEmail
  }

  const result = await emailjs.send(
    import.meta.env.VITE_EMAILJS_SERVICE_ID,
    import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
    templateParams,
    import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  )

  return result
}

export function saveOTPToStorage(email, otp) {
  localStorage.setItem("signbridge_reset_otp", otp)
  localStorage.setItem("signbridge_reset_email", email)
}

export function verifyOTP(enteredOTP) {
  const stored = localStorage.getItem("signbridge_reset_otp")
  return enteredOTP === stored
}

export function clearOTPFromStorage() {
  localStorage.removeItem("signbridge_reset_otp")
  localStorage.removeItem("signbridge_reset_email")
}
