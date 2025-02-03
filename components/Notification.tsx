import { useEffect } from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const notificationVariants = cva("fixed bottom-4 right-4 w-64 p-4 rounded-md shadow-md", {
  variants: {
    variant: {
      default: "bg-white text-gray-900",
      success: "bg-green-500 text-white",
      error: "bg-red-500 text-white",
      warning: "bg-yellow-500 text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

interface NotificationProps extends VariantProps<typeof notificationVariants> {
  message: string
  onClose: () => void
}

export function Notification({ message, variant, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={cn(notificationVariants({ variant }))}>
      <div className="flex justify-between items-center">
        <p>{message}</p>
        <button onClick={onClose} className="text-sm">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}

