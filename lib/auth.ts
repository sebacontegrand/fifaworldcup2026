import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"

// PrismaAdapter requires a plain PrismaClient — it's incompatible with $extends()
// Use a separate client here without Accelerate
const prismaForAuth = new PrismaClient()

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prismaForAuth as any),
    providers: [
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID!,
            clientSecret: process.env.AUTH_GOOGLE_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.AUTH_GITHUB_ID!,
            clientSecret: process.env.AUTH_GITHUB_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.AUTH_SECRET,
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                // Resolve correct user ID from email (handles stale JWT after DB reset)
                if (session.user.email) {
                    const dbUser = await prismaForAuth.user.findUnique({ where: { email: session.user.email }, select: { id: true } })
                    if (dbUser) {
                        session.user.id = dbUser.id
                        return session
                    }
                }
                session.user.id = token.id as string
            }
            return session
        },
    },
}
