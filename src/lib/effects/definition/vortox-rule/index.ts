import { EffectDefinition } from '../../types'

const definition: EffectDefinition = {
  id: 'vortox_rule',
  icon: 'star',
  defaultType: 'passive',
  persistence: {
    targetRoleChange: 'remove',
  },
  winConditions: [
    {
      trigger: 'end_of_day',
      check: (_state, game) => {
        let dayStartIndex = -1
        for (let i = game.history.length - 1; i >= 0; i--) {
          if (game.history[i].type === 'day_started') {
            dayStartIndex = i
            break
          }
        }

        if (dayStartIndex === -1) return null

        for (let i = dayStartIndex + 1; i < game.history.length; i++) {
          const type = game.history[i].type
          if (type === 'execution' || type === 'virgin_execution') {
            return null
          }
        }

        return 'demon'
      },
    },
  ],
}

export default definition
