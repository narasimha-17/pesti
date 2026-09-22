// Demo placeholder number — swap for the real business WhatsApp number when going live.
const WHATSAPP_NUMBER = '919000000000'
const DEFAULT_MESSAGE = 'Hi Lakshmi Agency, I have a question about your products.'

export default function WhatsAppButton({ message = DEFAULT_MESSAGE }) {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
  return (
    <a className="wa-fab" href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp (demo number)">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.27-1.38a9.9 9.9 0 004.77 1.22h.01c5.46 0 9.9-4.45 9.9-9.91S17.5 2 12.04 2zm5.77 14.03c-.24.68-1.4 1.3-1.93 1.38-.5.08-1.12.11-1.8-.11-.42-.13-.96-.31-1.65-.6-2.9-1.25-4.79-4.17-4.94-4.36-.15-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36.2 0 .39 0 .56.01.18.01.42-.07.65.5.24.58.82 2 .89 2.15.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.17-.31.38-.45.51-.15.15-.3.31-.13.6.17.3.77 1.28 1.66 2.07 1.14 1.02 2.11 1.34 2.4 1.49.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.29.39-.24.65-.15.27.1 1.68.79 1.97.94.29.15.49.22.56.34.07.13.07.73-.17 1.4z" />
      </svg>
    </a>
  )
}
