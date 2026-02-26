"use client"

import { signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"

export function SignIn() {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <Button onClick={() => signIn("google")} variant="default">
                Sign in with Google
            </Button>
            <Button onClick={() => signIn("github")} variant="outline">
                Sign in with GitHub
            </Button>
        </div>
    )
}

export function SignOut() {
    return (
        <Button variant="outline" onClick={() => signOut()}>
            Sign Out
        </Button>
    )
}
