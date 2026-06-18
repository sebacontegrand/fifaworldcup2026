import { Resend } from "resend"
import { prisma } from "@/lib/db"
import { buildMatchResultEmailHtml } from "@/lib/email-templates"

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_null")

function baseUrl(): string {
  return process.env.NEXTAUTH_URL ?? "https://fifaworldcup2026.vercel.app"
}

export async function sendMatchResultNotifications(
  matchId: string,
  actualScoreA: number,
  actualScoreB: number,
): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — skipping notification emails")
    return
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return

  const guesses = await prisma.guess.findMany({ where: { matchId } })
  const bets = await prisma.bet.findMany({ where: { matchId } })

  const userIds = [...new Set([...guesses.map((g) => g.userId), ...bets.map((b) => b.userId)])]
  if (userIds.length === 0) return

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true, emailNotifications: true },
  })

  const guessMap = new Map(guesses.map((g) => [g.userId, g]))
  const betMap = new Map(bets.map((b) => [b.userId, b]))

  for (const user of users) {
    if (!user.email || !user.emailNotifications) continue

    const guess = guessMap.get(user.id) ?? null
    const bet = betMap.get(user.id) ?? null

    const html = buildMatchResultEmailHtml({
      userName: user.name,
      teamAName: match.teamAName ?? match.teamAId ?? "Team A",
      teamBName: match.teamBName ?? match.teamBId ?? "Team B",
      actualScoreA,
      actualScoreB,
      guess: guess ? { scoreA: guess.scoreA, scoreB: guess.scoreB, points: guess.points } : null,
      bet: bet
        ? {
            scoreA: bet.scoreA,
            scoreB: bet.scoreB,
            wagerAmount: bet.wagerAmount,
            payout: bet.payout,
            oddsMultiplier: bet.oddsMultiplier,
          }
        : null,
      matchUrl: `${baseUrl()}/timeline/live`,
      settingsUrl: `${baseUrl()}/settings`,
    })

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "FIFA 2026 <onboarding@resend.dev>",
        to: user.email,
        subject: `${match.teamAName ?? match.teamAId} ${actualScoreA}-${actualScoreB} ${match.teamBName ?? match.teamBId} — Your Prediction Results`,
        html,
      })

      await prisma.emailNotification.create({
        data: {
          userId: user.id,
          matchId,
          type: guess && bet ? "both" : guess ? "guess" : "bet",
        },
      })
    } catch (err) {
      console.error(`Failed to send result email to ${user.email}:`, err)
    }
  }
}
