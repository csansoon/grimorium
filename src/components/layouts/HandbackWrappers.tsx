import type { ReactNode } from 'react'
import { useHandback } from '../context/PlayerFacingContext'
import { CardLink } from '../items/TeamBackground'
import { Button, type ButtonProps } from '../atoms'

/**
 * A CardLink that automatically routes its onClick through the
 * handback interstitial provided by the nearest PlayerFacingScreen.
 *
 * MUST be rendered inside a <PlayerFacingScreen> to work —
 * it calls useHandback() internally so the context resolves correctly.
 */
export function HandbackCardLink({
  onClick,
  isEvil,
  children,
}: {
  onClick: () => void
  isEvil: boolean
  children: ReactNode
}) {
  const { requestHandback } = useHandback()
  return (
    <CardLink onClick={() => requestHandback(onClick)} isEvil={isEvil}>
      {children}
    </CardLink>
  )
}

/**
 * A Button that automatically routes its onClick through the
 * handback interstitial provided by the nearest PlayerFacingScreen.
 *
 * MUST be rendered inside a <PlayerFacingScreen> to work.
 */
export function HandbackButton({
  onClick,
  ...rest
}: Omit<ButtonProps, 'onClick'> & { onClick: () => void }) {
  const { requestHandback } = useHandback()
  return <Button onClick={() => requestHandback(onClick)} {...rest} />
}
