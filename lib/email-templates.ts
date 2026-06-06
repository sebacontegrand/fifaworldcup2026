interface EmailData {
  userName: string | null
  teamAName: string
  teamBName: string
  actualScoreA: number
  actualScoreB: number
  guess: { scoreA: number; scoreB: number; points: number | null } | null
  bet: { scoreA: number; scoreB: number; wagerAmount: number; payout: number | null; oddsMultiplier: number } | null
  matchUrl: string
  settingsUrl: string
}

export function buildMatchResultEmailHtml(data: EmailData): string {
  const {
    userName,
    teamAName,
    teamBName,
    actualScoreA,
    actualScoreB,
    guess,
    bet,
    matchUrl,
    settingsUrl,
  } = data

  const greeting = userName ? `Hi ${userName},` : "Hi there,"
  const exactGuess = guess && guess.scoreA === actualScoreA && guess.scoreB === actualScoreB
  const guessPoints = guess?.points ?? 0
  const betWon = bet && bet.payout && bet.payout > 0
  const betAccuracy = bet ? getBetLabel(bet.scoreA, bet.scoreB, actualScoreA, actualScoreB) : null

  const guessSection = guess
    ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f2937;">
          <div style="color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Your Prediction</div>
          <div style="font-size: 20px; font-weight: 700; color: #f3f4f6;">
            ${guess.scoreA} - ${guess.scoreB}
            ${exactGuess ? `<span style="color: #22c55e; font-size: 14px; margin-left: 8px;">✅ Exact!</span>` : ""}
          </div>
          <div style="color: ${guessPoints > 0 ? "#22c55e" : "#6b7280"}; font-size: 14px; font-weight: 600; margin-top: 2px;">
            ${guessPoints > 0 ? `+${guessPoints} points` : "0 points"}
          </div>
        </td>
      </tr>`
    : ""

  const betSection = bet
    ? `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #1f2937;">
          <div style="color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Your Bet</div>
          <div style="font-size: 14px; color: #d1d5db;">
            ${bet.scoreA} - ${bet.scoreB}
            <span style="color: #6b7280; font-size: 12px;">(${betAccuracy})</span>
          </div>
          <div style="font-size: 14px; color: #d1d5db; margin-top: 2px;">
            Wager: <strong>${bet.wagerAmount}</strong> chips
            ${bet.payout != null ? `→ <span style="color: ${betWon ? "#22c55e" : "#ef4444"}; font-weight: 700;">${betWon ? `+${bet.payout}` : "Lost"} chips</span>` : ""}
          </div>
        </td>
      </tr>`
    : ""

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #09090b; padding: 24px 16px;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="max-width: 480px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0a2e1a 0%, #0d1117 100%); border-radius: 16px 16px 0 0; padding: 24px; text-align: center; border: 1px solid #1f2937; border-bottom: none;">
              <div style="font-size: 24px; font-weight: 800; color: #f3f4f6; text-transform: uppercase; letter-spacing: -0.02em;">
                ${teamAName}
                <span style="color: #22d3ee; padding: 0 8px;">${actualScoreA} - ${actualScoreB}</span>
                ${teamBName}
              </div>
              <div style="color: #6b7280; font-size: 12px; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em;">Final Score</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #0d1117; padding: 24px; border-left: 1px solid #1f2937; border-right: 1px solid #1f2937;">
              <div style="color: #f3f4f6; font-size: 15px; margin-bottom: 16px;">${greeting}</div>
              <div style="color: #9ca3af; font-size: 13px; margin-bottom: 16px;">
                The result is in! Here's how your predictions stack up:
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                ${guessSection}
                ${betSection}
              </table>

              ${!guess && !bet ? `
                <div style="color: #6b7280; font-size: 13px; text-align: center; padding: 16px 0;">
                  You didn't place a prediction or bet on this match.
                </div>
              ` : ""}

              <!-- CTA -->
              <div style="text-align: center; margin-top: 24px;">
                <a href="${matchUrl}" style="display: inline-block; background: linear-gradient(135deg, #22d3ee, #06b6d4); color: #09090b; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                  Continue Playing →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0a0a0f; border-radius: 0 0 16px 16px; padding: 16px 24px; text-align: center; border: 1px solid #1f2937; border-top: none;">
              <div style="color: #4b5563; font-size: 11px;">
                <a href="${settingsUrl}" style="color: #6b7280; text-decoration: underline;">Notification Preferences</a>
                <span style="margin: 0 8px;">·</span>
                <span>FIFA World Cup 2026 Predictor</span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function getBetLabel(a: number, b: number, actualA: number, actualB: number): string {
  if (a === actualA && b === actualB) return "Exact match!"
  const diff = (a - b) - (actualA - actualB)
  if (diff === 0) return "Correct goal difference"
  if ((a > b && actualA > actualB) || (b > a && actualB > actualA)) return "Correct winner"
  return "Missed"
}
