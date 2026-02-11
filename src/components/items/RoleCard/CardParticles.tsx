import React from 'react'

/** Faint twinkling stars scattered across the card for Townsfolk */
export function TownsfolkParticles() {
  const stars = [
    { top: '12%', left: '15%', duration: '3.5s', delay: '0s' },
    { top: '28%', left: '82%', duration: '4.2s', delay: '1.2s' },
    { top: '55%', left: '8%', duration: '3.8s', delay: '0.5s' },
    { top: '72%', left: '75%', duration: '4.5s', delay: '2.0s' },
    { top: '88%', left: '35%', duration: '3.2s', delay: '1.7s' },
    { top: '40%', left: '92%', duration: '4.0s', delay: '0.8s' },
  ]
  return (
    <>
      {stars.map((s, i) => (
        <div
          key={i}
          className='card-star-particle'
          style={
            {
              top: s.top,
              left: s.left,
              '--star-duration': s.duration,
              '--star-delay': s.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}

/** Rising ember particles for Minion cards */
export function MinionParticles() {
  const embers = [
    { bottom: '8%', left: '20%', duration: '3.5s', delay: '0s' },
    { bottom: '5%', left: '55%', duration: '4.0s', delay: '0.8s' },
    { bottom: '12%', left: '78%', duration: '3.2s', delay: '1.5s' },
    { bottom: '3%', left: '38%', duration: '4.5s', delay: '2.2s' },
    { bottom: '6%', left: '90%', duration: '3.8s', delay: '0.3s' },
  ]
  return (
    <>
      {embers.map((e, i) => (
        <div
          key={i}
          className='card-ember-particle'
          style={
            {
              bottom: e.bottom,
              left: e.left,
              '--ember-duration': e.duration,
              '--ember-delay': e.delay,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  )
}
