import { describe, expect, it } from 'vitest'
import { toCompanyRequest, toFormValues } from './companyForm'

describe('toCompanyRequest', () => {
  it('trimmt und sendet leere Felder als null', () => {
    expect(
      toCompanyRequest({
        name: ' Beispiel Energie AG ',
        website: '',
        street: ' Energieweg 38 ',
        postalCode: ' ',
        city: 'Frankfurt',
      }),
    ).toEqual({
      body: {
        name: 'Beispiel Energie AG',
        website: null,
        street: 'Energieweg 38',
        postalCode: null,
        city: 'Frankfurt',
      },
    })
  })

  it('verlangt einen Namen', () => {
    expect(toCompanyRequest({ name: '  ', website: '', street: '', postalCode: '', city: '' })).toEqual({
      error: 'Bitte einen Namen eingeben.',
    })
  })

  it('übernimmt fehlende Angaben als leere Felder', () => {
    expect(
      toFormValues({ id: 'x', name: 'A', website: null, street: null, postalCode: '1', city: null }),
    ).toEqual({ name: 'A', website: '', street: '', postalCode: '1', city: '' })
  })
})
