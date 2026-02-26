import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { SignIn, SignOut } from "@/components/auth-buttons"
import { HomePageContent } from "@/components/home-page-content"

export default async function HomePage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 relative">
      <div className="absolute top-8 right-4 flex items-center gap-4">
        {session?.user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline-block">
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
