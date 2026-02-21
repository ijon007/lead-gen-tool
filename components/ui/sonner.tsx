"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CheckCircleIcon, InfoIcon, WarningIcon, XCircleIcon, SpinnerIcon } from "@phosphor-icons/react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme()
  const effectiveTheme = resolvedTheme ?? (theme === "system" ? undefined : theme)

  return (
    <Sonner
      theme={(effectiveTheme as ToasterProps["theme"]) ?? "system"}
      className="toaster group"
      position="bottom-right"
      closeButton={false}
      gap={6}
      icons={{
        success: (
          <CheckCircleIcon className="size-4 shrink-0" weight="fill" />
        ),
        info: (
          <InfoIcon className="size-4 shrink-0" weight="fill" />
        ),
        warning: (
          <WarningIcon className="size-4 shrink-0" weight="fill" />
        ),
        error: (
          <XCircleIcon className="size-4 shrink-0" weight="fill" />
        ),
        loading: (
          <SpinnerIcon className="size-4 shrink-0 animate-spin" weight="fill" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "cn-toast-title",
          description: "cn-toast-description",
          closeButton: "cn-toast-close",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
