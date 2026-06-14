import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

const CONNECTION_WEIGHT = 0.20
const PREDICTION_WEIGHT = 0.30
const POOL_WEIGHT = 0.35
const GAMES_WEIGHT = 0.15

export async function GET() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, image: true },
  })

  const connectionScores = await prisma.connectionScore.groupBy({
    by: ["userId"],
    _max: { score: true },
    _count: { id: true },
  })

  const guessPoints = await prisma.guess.groupBy({
    by: ["userId"],
    _sum: { points: true },
    _count: { id: true },
  })

  const poolPayouts = await prisma.bet.groupBy({
    by: ["userId"],
    _sum: { payout: true },
    _count: { id: true },
  })

  const gameScores = await prisma.gameScore.groupBy({
    by: ["userId"],
    _max: { score: true },
    _count: { id: true },
  })

  const adjustments = await prisma.chipBalance.findMany({
    where: { rankingAdjustment: { not: 0 } },
    select: { userId: true, rankingAdjustment: true },
  })

  const csMap = new Map(connectionScores.map((c) => [c.userId, { bestScore: c._max.score ?? 0, gamesPlayed: c._count.id }]))
  const gpMap = new Map(guessPoints.map((g) => [g.userId, { totalPoints: g._sum.points ?? 0, totalGuesses: g._count.id }]))
  const ppMap = new Map(poolPayouts.map((p) => [p.userId, { totalPayout: p._sum.payout ?? 0, totalBets: p._count.id }]))
  const gsMap = new Map(gameScores.map((g) => [g.userId, { bestScore: g._max.score ?? 0, totalGames: g._count.id }]))
  const adjMap = new Map(adjustments.map((a) => [a.userId, a.rankingAdjustment]))

  let maxBestScore = 0
  let maxTotalPoints = 0
  let maxTotalPayout = 0
  let maxGameScore = 0

  for (const user of users) {
    const cs = csMap.get(user.id)
    const gp = gpMap.get(user.id)
    const pp = ppMap.get(user.id)
    const gs = gsMap.get(user.id)
    if (cs && cs.bestScore > maxBestScore) maxBestScore = cs.bestScore
    if (gp && gp.totalPoints > maxTotalPoints) maxTotalPoints = gp.totalPoints
    if (pp && pp.totalPayout > maxTotalPayout) maxTotalPayout = pp.totalPayout
    if (gs && gs.bestScore > maxGameScore) maxGameScore = gs.bestScore
  }

  const leaderboard = users
    .map((user) => {
      const cs = csMap.get(user.id)
      const gp = gpMap.get(user.id)
      const pp = ppMap.get(user.id)
      const gs = gsMap.get(user.id)

      const rawConnection = cs ? cs.bestScore : 0
      const rawPrediction = gp ? gp.totalPoints : 0
      const rawPool = pp ? pp.totalPayout : 0
      const rawGame = gs ? gs.bestScore : 0

      const connectionSkill = maxBestScore > 0 ? (rawConnection / maxBestScore) * 100 : 0
      const predictionSkill = maxTotalPoints > 0 ? (rawPrediction / maxTotalPoints) * 100 : 0
      const poolSkill = maxTotalPayout > 0 ? (rawPool / maxTotalPayout) * 100 : 0
      const gameSkill = maxGameScore > 0 ? (rawGame / maxGameScore) * 100 : 0

      const adjustment = adjMap.get(user.id) ?? 0

      const overallScore = connectionSkill * CONNECTION_WEIGHT + predictionSkill * PREDICTION_WEIGHT + poolSkill * POOL_WEIGHT + gameSkill * GAMES_WEIGHT + adjustment

      return {
        userId: user.id,
        name: user.name,
        image: user.image,
        overallScore: Math.round(overallScore * 100) / 100,
        adjustment,
        connection: { bestScore: rawConnection, skill: Math.round(connectionSkill * 100) / 100, gamesPlayed: cs?.gamesPlayed ?? 0 },
        prediction: { totalPoints: rawPrediction, skill: Math.round(predictionSkill * 100) / 100, totalGuesses: gp?.totalGuesses ?? 0 },
        pool: { totalPayout: rawPool, skill: Math.round(poolSkill * 100) / 100, totalBets: pp?.totalBets ?? 0 },
        games: { bestScore: rawGame, skill: Math.round(gameSkill * 100) / 100, totalGames: gs?.totalGames ?? 0 },
      }
    })
    .sort((a, b) => b.overallScore - a.overallScore)
    .map((entry, i) => ({ ...entry, rank: i + 1 }))

  return NextResponse.json({ leaderboard, totalPlayers: leaderboard.length })
}
