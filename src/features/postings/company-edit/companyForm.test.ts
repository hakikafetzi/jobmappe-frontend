import { describe, expect, it } from 'vitest'
import { INVALID_POSTAL_CODE } from '../../../shared/lib/postalCode'
import { INVALID_URL } from '../../../shared/lib/url'
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

  it('verlangt einen Namen und eine öffnbare Webseite', () => {
    expect(
      toCompanyRequest({ name: '  ', website: 'foo bar', street: '', postalCode: '', city: '' }),
    ).toEqual({
      errors: { name: 'Bitte einen Namen eingeben.', website: INVALID_URL },
    })
  })

  it('prüft eine angegebene PLZ', () => {
    expect(
      toCompanyRequest({ name: 'Firma AG', website: '', street: '', postalCode: 'abc', city: '' }),
    ).toEqual({
      errors: { postalCode: INVALID_POSTAL_CODE },
    })
  })

  it('prüft Name, Straße und Stadt auf sinnvolle Eingaben', () => {
    expect(
      toCompanyRequest({
        name: '!!',
        website: '',
        street: 'Musterstraße',
        postalCode: '',
        city: 'Frankfurt1',
      }),
    ).toEqual({
      errors: {
        name: 'Bitte einen gültigen Firmennamen eingeben.',
        street: 'Bitte Straße und Hausnummer angeben (z. B. Musterstraße 12).',
        city: 'Bitte einen gültigen Ortsnamen eingeben.',
      },
    })
  })

  it('speichert die Webseite wie eingegeben', () => {
    expect(
      toCompanyRequest({
        name: 'Firma AG',
        website: ' firma.example ',
        street: '',
        postalCode: '',
        city: '',
      }),
    ).toMatchObject({ body: { website: 'firma.example' } })
  })

  it('übernimmt fehlende Angaben als leere Felder', () => {
    expect(
      toFormValues({ id: 'x', name: 'A', website: null, street: null, postalCode: '1', city: null }),
    ).toEqual({ name: 'A', website: '', street: '', postalCode: '1', city: '' })
  })
})
