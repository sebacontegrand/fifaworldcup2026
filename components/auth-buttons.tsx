import { Button } from "@/components/ui/button"
import { signInAction, signOutAction } from "@/lib/auth-actions"

export function SignIn() {
    return (
        <form action={signInAction}>
            <Button type="submit">Sign in with Google</Button>
        </form>
    )
}

export function SignOut() {
    return (
        <form action={signOutAction}>
            <Button variant="outline" type="submit">Sign Out</Button>
        </form>
    )
}
