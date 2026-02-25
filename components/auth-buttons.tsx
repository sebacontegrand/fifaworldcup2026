import { Button } from "@/components/ui/button"
import { signInAction, signInWithGithubAction, signOutAction } from "@/lib/auth-actions"

export function SignIn() {
    return (
        <div className="flex flex-col sm:flex-row items-center gap-2">
            <form action={signInAction}>
                <Button type="submit" variant="default">Sign in with Google</Button>
            </form>
            <form action={signInWithGithubAction}>
                <Button type="submit" variant="outline">Sign in with GitHub</Button>
            </form>
        </div>
    )
}

export function SignOut() {
    return (
        <form action={signOutAction}>
            <Button variant="outline" type="submit">Sign Out</Button>
        </form>
    )
}
