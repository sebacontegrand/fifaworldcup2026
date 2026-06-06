"use client"

import { EmailSettings } from "@/components/email-settings"
import { Settings, ChevronRight, Mail } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-[800px] px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
          Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage your account preferences and notifications.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5" />
            Notifications
          </h2>
          <EmailSettings />
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-white/30 mb-3">Account</h2>
          <Link
            href="/pool"
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-white/30 shrink-0" />
              <div>
                <div className="text-sm font-bold text-white">Confidence Pool</div>
                <p className="text-xs text-white/40">Place bets and track your chip balance</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-white/30" />
          </Link>
        </div>
      </div>
    </div>
  )
}
