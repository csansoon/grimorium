import { EffectDefinition } from '../../types'

const definition: EffectDefinition = {
  id: 'vigormortis_killed',
  icon: 'crown',
  defaultType: 'marker',
  persistence: {
    targetRoleChange: 'remove',
  },
}

export default definition
