"use client"

const username = process.env.NEXT_PUBLIC_CAFECITO_USERNAME

export function CafecitoButton() {
  if (!username) return null

  return (
    <a
      href={`https://cafecito.app/${username}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block shrink-0"
    >
      <img
        srcSet="https://cdn.cafecito.app/imgs/buttons/button_2.png 1x, https://cdn.cafecito.app/imgs/buttons/button_2_2x.png 2x"
        src="https://cdn.cafecito.app/imgs/buttons/button_2.png"
        alt="Invítame un café en Cafecito"
        className="h-8 w-auto"
      />
    </a>
  )
}
