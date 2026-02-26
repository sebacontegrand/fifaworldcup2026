"use server"

// These are kept for backwards-compatibility but the buttons now use next-auth/react client SDK directly.
// This file is no longer used by auth-buttons.tsx, but may be used by other server actions.

export async function signInWithGoogleAction() {
    // Handled client-side via next-auth/react signIn("google")
}

export async function signInWithGithubAction() {
    // Handled client-side via next-auth/react signIn("github")
}

export async function signOutAction() {
    // Handled client-side via next-auth/react signOut()
}
