import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SignIn, SignOut } from "@/components/auth-buttons"
import { HomePageContent } from "@/components/home-page-content"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Auth Section at the top of the page content */}
      <div className="mb-8 flex flex-col items-center justify-center gap-4 rounded-xl border border-border/50 bg-secondary/50 p-6 backdrop-blur-sm sm:flex-row sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            {session?.user ? "Welcome back!" : "Save your predictions"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            {session?.user
              ? "Your progress is automatically saved to your account."
              : "Sign in to save your custom brackets and teams."}
          </p>
        </div>

        {session?.user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-primary font-bold">
              {session.user.name || session.user.email}
            </span>
            <SignOut />
          </div>
        ) : (
          <SignIn />
        )}
      </div>

      <HomePageContent />
    </div>
  )
}
