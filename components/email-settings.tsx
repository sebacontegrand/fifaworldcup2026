"use client"

import { useState, useEffect } from "react"
import { Switch } from "@/components/ui/switch"
import { Loader2, Bell, BellOff } from "lucide-react"

export function EmailSettings() {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/user/notifications")
      .then((r) => r.json())
      .then((d) => {
        setEnabled(d.emailNotifications ?? true)
        setEmail(d.email ?? null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const toggle = async (value: boolean) => {
    setSaving(true)
    setEnabled(value)
    try {
      await fetch("/api/user/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotifications: value }),
      })
    } catch {
      setEnabled(!value)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-white/40 py-4">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Loading preferences...
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start gap-3">
        {enabled ? (
          <Bell className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        ) : (
          <BellOff className="h-5 w-5 text-white/30 shrink-0 mt-0.5" />
        )}
        <div>
          <div className="text-sm font-bold text-white flex items-center gap-2">
            Email Notifications
            {saving && <Loader2 className="h-3 w-3 animate-spin text-white/40" />}
          </div>
          <p className="text-xs text-white/40 mt-0.5">
            {enabled
              ? `Get emails when match results are in — sent to ${email ?? "your account"}`
              : "You won't receive result notification emails"}
          </p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={toggle} disabled={saving} />
    </div>
  )
}
