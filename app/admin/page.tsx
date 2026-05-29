import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminContent } from "./admin-content"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL

  // If there is no session or the user's email doesn't match the admin email, redirect to home
  if (!session?.user?.email || (adminEmail && session.user.email.toLowerCase() !== adminEmail.toLowerCase())) {
    redirect("/")
  }

  return <AdminContent />
}
