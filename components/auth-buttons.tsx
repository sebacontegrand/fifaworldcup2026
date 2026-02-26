"use client"

import { signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignIn() {
    return (
        <div className="flex flex-row items-center gap-1.5">
            <Button onClick={() => signIn("google")} variant="default" className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs">
                Sign in with Google
            </Button>
            <Button onClick={() => signIn("github")} variant="outline" className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs">
                Sign in with GitHub
            </Button>
        </div>
    )
}

export function SignOut() {
    return (
        <Button variant="outline" className="h-8 px-2 sm:px-3 text-[10px] sm:text-xs" onClick={() => signOut()}>
            Sign Out
        </Button>
    )
}
