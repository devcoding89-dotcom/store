import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

type QRCodeDisplayProps = {
  value: string
  size?: number
  className?: string
}

export function QRCodeDisplay({ value, size = 180, className = '' }: QRCodeDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string>('')

  useEffect(() => {
    if (!value) return
    QRCode.toDataURL(value, {
      width: size,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setDataUrl(url))
      .catch((err) => {
        console.error('Failed to generate QR Code:', err)
        // Fallback to QR server API if canvas fails
        setDataUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`)
      })
  }, [value, size])

  if (!dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-400 ${className}`}
      >
        Generating QR...
      </div>
    )
  }

  return (
    <img
      src={dataUrl}
      alt={`QR Code for ${value}`}
      width={size}
      height={size}
      className={`rounded-xl border border-slate-200 bg-white p-2 shadow-xs ${className}`}
    />
  )
}
