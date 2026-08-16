export function notificationStatus(){return Object.freeze({
  resend:{configured:Boolean(process.env.RESEND_API_KEY?.trim())},
  smtp:{configured:Boolean(process.env.SMTP_HOST?.trim()&&process.env.SMTP_PORT?.trim()&&process.env.SMTP_USER?.trim()&&process.env.SMTP_PASSWORD?.trim())},
  webhook:{configured:Boolean(process.env.POWERCHAIN_MAIL_WEBHOOK_URL?.trim())},
});}
