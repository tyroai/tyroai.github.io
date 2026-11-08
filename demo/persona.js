// Demo kullanıcısı: her veri setinde AYNI kişi. Tamamen kurgusaldır.
export const TENANT_ID = "6f2b8c1d-3a4e-4f5b-8c9d-0e1f2a3b4c5d"

export const PERSONA = {
  id: "0d3f9a52-6b1e-4c7a-9e21-5a8c3f1b7d01",
  givenName: "Ömer",
  surname: "Gümüş",
  displayName: "Ömer Gümüş",
  initials: "ÖG",
  mail: "omer.gumus@tyrotech.example",
  userPrincipalName: "omer.gumus@tyrotech.example",
  jobTitle: "Satış Yöneticisi",
  jobTitleEn: "Sales Manager",
  department: "Satış",
  // ERP şirket kısa adlarıyla eşleşir (data/companyShortNames.js)
  companyName: "TYRO TECH YAZILIM DANIŞMANLIK HİZMETLERİ TİCARET ANONİM ŞİRKETİ",
  officeLocation: "İstanbul · Maslak",
  mobilePhone: "+90 555 010 20 30",
  businessPhones: ["+90 212 555 01 20"],
  preferredLanguage: "tr-TR",
  city: "İstanbul",
  country: "Türkiye",
}

/** MSAL hesabı (sahte): her zaman oturum açık. */
export const ACCOUNT = {
  homeAccountId: `${PERSONA.id}.${TENANT_ID}`,
  environment: "login.microsoftonline.com",
  tenantId: TENANT_ID,
  username: PERSONA.userPrincipalName,
  localAccountId: PERSONA.id,
  name: PERSONA.displayName,
  authorityType: "MSSTS",
  idTokenClaims: {
    name: PERSONA.displayName,
    preferred_username: PERSONA.userPrincipalName,
    email: PERSONA.mail,
    oid: PERSONA.id,
    tid: TENANT_ID,
    groups: [],
  },
}
