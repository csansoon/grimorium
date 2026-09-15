import { describe, expect, it } from 'vitest'
import en from '../i18n/translations/en'
import es from '../i18n/translations/es'
import drunkEn from '../roles/definition/trouble-brewing/drunk/i18n/en'
import drunkEs from '../roles/definition/trouble-brewing/drunk/i18n/es'
import poisonerEn from '../roles/definition/trouble-brewing/poisoner/i18n/en'
import poisonerEs from '../roles/definition/trouble-brewing/poisoner/i18n/es'
import spyEn from '../roles/definition/trouble-brewing/spy/i18n/en'
import spyEs from '../roles/definition/trouble-brewing/spy/i18n/es'

describe('malfunction guidance', () => {
  it.each([
    en.howToPlay.p1_conceptPoison,
    en.howToPlay.p2_nightTip,
    en.howToPlay.p4_pitfalls3,
    drunkEn.lines[2].text,
    poisonerEn.lines[1].text,
    spyEn.spyMalfunctionDescription,
  ])('describes English information as potentially true or false', (copy) => {
    expect(copy).toMatch(/true or false/)
  })

  it.each([
    es.howToPlay.p1_conceptPoison,
    es.howToPlay.p2_nightTip,
    es.howToPlay.p4_pitfalls3,
    drunkEs.lines[2].text,
    poisonerEs.lines[1].text,
    spyEs.spyMalfunctionDescription,
  ])('describes Spanish information as potentially true or false', (copy) => {
    expect(copy).toMatch(/verdader[oa] o fals[oa]/)
  })
})
