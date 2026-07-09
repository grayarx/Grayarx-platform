/**
 * Nala showroom chat — native templates for all 11 SA official languages + Portuguese.
 * Variables: {name} {color} {price} {km} {fuel} {transmission} {location} {dealership} {specs}
 */

import {
  type LanguageCode,
  LANGUAGES,
  detectLanguage,
  SA_OFFICIAL_LANGUAGES,
} from "./languages";

export type { LanguageCode };
export { detectLanguage, SA_OFFICIAL_LANGUAGES, LANGUAGES };

type Vars = Record<string, string | number | undefined>;

function fill(template: string, vars: Vars): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v != null ? String(v) : "";
  });
}

type LangStrings = Record<LanguageCode, string>;

// ─── Flow prompts ───────────────────────────────────────────────────────────

export const PROMPT_ASK_NAME: LangStrings = {
  en: "I can pass that to the team. What's your name?",
  af: "Ek kan dit vir die span deurgee. Wat is jou naam?",
  zu: "Ngingakudlulisela ithimba. Igama lakho ngubani?",
  xh: "Ndingakudlulisela iqela. Ngubani igama lakho?",
  st: "Nka fetisetsa sehlopheng. Lebitso la hao ke mang?",
  nso: "Ke ka go fetišetša sehlopheng. Leina la gago ke mang?",
  tn: "Nka go fetisetsa sehlopheng. Leina la gago ke mang?",
  ts: "Ndzi ta ku rhumela eka ntlawa. Vito ra wena i mani?",
  ss: "Ngitawudlulisa ethimeni. Ligama lakho ngubani?",
  ve: "Ndo rumela tshitshavha. Zwi ita zwine?",
  nr: "Ngizokudlulisa ithimba. Igama lakho ngubani?",
  pt: "Posso encaminhar à equipa. Qual é o seu nome?",
};

export const PROMPT_ASK_EMAIL: LangStrings = {
  en: "Thanks! Email address?",
  af: "Dankie! E-posadres?",
  zu: "Ngiyabonga! Ikheli le-imeyili?",
  xh: "Enkosi! Idilesi ye-imeyili?",
  st: "Ke a leboha! Aterese ea imeile?",
  nso: "Ke a leboga! Aterese ya imeile?",
  tn: "Ke a leboga! Aterese ya imeile?",
  ts: "Ndza khensa! Adirese ya imeyili?",
  ss: "Ngiyabonga! Likheli le-imeyili?",
  ve: "Ndo livhuwa! Imeyili?",
  nr: "Ngiyathokoza! Ikheli le-imeyili?",
  pt: "Obrigado! Endereço de e-mail?",
};

export const PROMPT_ASK_PHONE: LangStrings = {
  en: "And your phone number?",
  af: "En jou foonnommer?",
  zu: "Futhi inombolo yakho yocingo?",
  xh: "Kwaye inombolo yakho yefowuni?",
  st: "Le nomoro ea hao ea mohala?",
  nso: "Le nomoro ya gago ya mogala?",
  tn: "Le nomoro ya gago ya mogala?",
  ts: "Nomboro ya wena ya riqingho?",
  ss: "Nombolo yakho yocingo?",
  ve: "Nomboro ya luṱingo?",
  nr: "Futhi inombolo yakho yocingo?",
  pt: "E o seu número de telefone?",
};

export const PROMPT_FOLLOW_UP: LangStrings = {
  en: "Anything else about this car, or pick an option below?",
  af: "Iets anders oor hierdie motor, of kies 'n opsie hieronder?",
  zu: "Okunye mayelana nemoto, noma khetha inketho engezansi?",
  xh: "Enye into ngale moto, okanye khetha ukhetho ngezantsi?",
  st: "Ho na le se seng? khetha khetho ka tlase.",
  nso: "Go na le se sengwe? kgetha kgetho ka fase.",
  tn: "Go na le se sengwe? kgetha kgetho fa tlase.",
  ts: "Xiphiqo xin'wana? hlawula xitlhaviso laha hansi.",
  ss: "Lokunye mayelana nemoto, noma ukhethe lokukhetsa ngezansi?",
  ve: "Zwiṅwe? nangani nga fhasi.",
  nr: "Okunye mayelana nemoto, noma ukhethe okukhethwa ngezansi?",
  pt: "Mais alguma coisa sobre este carro, ou escolha uma opção abaixo?",
};

export const PROMPT_THANKS_ENQUIRY: LangStrings = {
  en: "Thanks {name}! The team at {dealership} will get back to you shortly about the {vehicle}.",
  af: "Dankie {name}! Die span by {dealership} sal binnekort op jou vraag oor die {vehicle} reageer.",
  zu: "Ngiyabonga {name}! Ithimba e-{dealership} lizokuphendula maduze mayelana ne-{vehicle}.",
  xh: "Enkosi {name}! Iqela e-{dealership} liza kukuphendula kungekudala ngale {vehicle}.",
  st: "Ke a leboha {name}! Sehlopha sa {dealership} se tla araba haufinyane mabapi le {vehicle}.",
  nso: "Ke a leboga {name}! Sehlopha sa {dealership} se tla go araba ka pela mabapi le {vehicle}.",
  tn: "Ke a leboga {name}! Sehlopha sa {dealership} se tla go araba ka bonako mabapi le {vehicle}.",
  ts: "Ndza khensa {name}! Ntlawa wa {dealership} wu ta ku hlamula hi ku hatlisa hi {vehicle}.",
  ss: "Ngiyabonga {name}! Sithimba se-{dealership} sitawuphendvula ngokushesha nge-{vehicle}.",
  ve: "Ndo livhuwa {name}! Tshitshavha tsha {dealership} tshi do fhindula nga u fhambanaho nga {vehicle}.",
  nr: "Ngiyathokoza {name}! Ithimba e-{dealership} lizokuphendula masinyane nge-{vehicle}.",
  pt: "Obrigado {name}! A equipa da {dealership} entrará em contacto em breve sobre o {vehicle}.",
};

export const GREETING: LangStrings = {
  en: "Hi! I'm **Nala**, your AI assistant at **{dealership}**.\n\nYou're viewing the **{name}** — **{price}** ({specs}).\n\nAsk me anything in any of South Africa's 11 official languages. Or pick an option below.",
  af: "Hallo! Ek is **Nala**, jou KI-assistent by **{dealership}**.\n\nJy kyk na die **{name}** — **{price}** ({specs}).\n\nVra my enigiets in Afrikaans, Engels, of enige amptelike SA-taal. Of kies 'n opsie hieronder.",
  zu: "Sawubona! Ngingu-**Nala**, umsizi wakho we-AI e-**{dealership}**.\n\nUbuka i-**{name}** — **{price}** ({specs}).\n\nNgibuze noma yini ngesiZulu, isiNgisi, noma olunye ulimi olusemthethweni lwe-SA.",
  xh: "Molo! Ndingu-**Nala**, uncedi wakho we-AI e-**{dealership}**.\n\nUjonge i-**{name}** — **{price}** ({specs}).\n\nNdibuze nantoni na ngolunye ulimi lwaseMzantsi Afrika.",
  st: "Dumela! Ke **Nala**, mothusi wa hao wa AI ho **{dealership}**.\n\nO shebile **{name}** — **{price}** ({specs}).\n\nMpotsa eng kapa eng ka puo efe kapa efe ea SA.",
  nso: "Thobela! Ke **Nala**, mothuši wa gago wa AI go **{dealership}**.\n\nO lebeletše **{name}** — **{price}** ({specs}).\n\nBotsiša eng ka puo efe goba efe ya Afrika Borwa.",
  tn: "Dumela! Ke **Nala**, mothusi wa gago wa AI mo **{dealership}**.\n\nO lebeletse **{name}** — **{price}** ({specs}).\n\nMpotsa sepe sepe ka puo efe kapa efe ya Aforika Borwa.",
  ts: "Avuxeni! Ndzi **Nala**, mpfuni wa wena wa AI eka **{dealership}**.\n\nU langutisa **{name}** — **{price}** ({specs}).\n\nVutisa xiphiqo xihi na xihi hi ririmi ra Afrika Dzonga.",
  ss: "Sawubona! Ngingu-**Nala**, umsiti wakho we-AI e-**{dealership}**.\n\nUyabuka i-**{name}** — **{price}** ({specs}).\n\nNgibuze noma yini ngeSiSwati noma lolunye lulwimi lwaseNingizimu Afrika.",
  ve: "Ndaa! Ndi **Nala**, thusi ya vhupo ya AI kha **{dealership}**.\n\nU sedza **{name}** — **{price}** ({specs}).\n\nNdi bvudza nga tshila mafhungo o fhelelaho Afurika Tshipembe.",
  nr: "Lotjhani! Ngingu-**Nala**, umsizi wakho we-AI e-**{dealership}**.\n\nUbheka i-**{name}** — **{price}** ({specs}).\n\nNgibuze noma yini ngezilimi zaseNingizimu Afrika.",
  pt: "Olá! Sou a **Nala**, assistente de IA da **{dealership}**.\n\nEstá a ver o **{name}** — **{price}** ({specs}).\n\nPergunte em português, inglês ou qualquer idioma oficial da África do Sul.",
};

// ─── Intent replies ─────────────────────────────────────────────────────────

export const REPLY_COLOR_KNOWN: LangStrings = {
  en: "This **{name}** is listed in **{color}**. Want to book a test drive to see it in person?",
  af: "Hierdie **{name}** is gelys in **{color}**. Wil jy 'n toetsrit bespreek om dit persoonlik te sien?",
  zu: "Le **{name}** ibhalwe ngo-**{color}**. Ufuna ukubhukha ukushayela ukuze uyibone?",
  xh: "Le **{name}** ibhalwe ngo-**{color}**. Ufuna ukubhukisha ukushayela?",
  st: "**{name}** e thathamisitsoe ka **{color}**. U batla ho bua tekete ea ho leka koloi?",
  nso: "**{name}** e supilwe ka **{color}**. O nyaka go beela tekete ya go leka koloi?",
  tn: "**{name}** e supilwe ka **{color}**. A o batla go beela tekete ya go leka koloi?",
  ts: "**{name}** yi kombisiwile hi **{color}**. U lava ku veka xihloko xa ku kamberiwa?",
  ss: "Le **{name}** ibhalwe nge-**{color}**. Ufuna kubhukha kushayela?",
  ve: "**{name}** i re nga **{color}**. Ni funa u booka test drive?",
  nr: "Le **{name}** ibhalwe ngo-**{color}**. Ufuna ukubhukha ukushayela?",
  pt: "Este **{name}** está listado em **{color}**. Quer marcar um test drive?",
};

export const REPLY_COLOR_UNKNOWN: LangStrings = {
  en: "I don't have the exact colour on file for the **{name}** yet — I'll ask the team to confirm. What's your name so we can follow up?",
  af: "Ek het nie die presiese kleur vir die **{name}** op rekord nie — ek sal die span vra om te bevestig. Wat is jou naam sodat ons kan opvolg?",
  zu: "Anginayo umbala oqondile we-**{name}** — ngizocela ithimba liqinisekise. Igama lakho ngubani ukuze sikuthinte?",
  xh: "Andinayo umbala ochaziweyo we-**{name}** — ndiza kubuza iqela. Ngubani igama lakho?",
  st: "Ha ke na mmala o hlakileng oa **{name}** — ke tla botsa sehlopha. Lebitso la hao ke mang?",
  nso: "Ga ke na mmala wa **{name}** — ke tla botsa sehlopha. Leina la gago ke mang?",
  tn: "Ga ke na mmala wa **{name}** — ke tla botsa sehlopha. Leina la gago ke mang?",
  ts: "A ndzi na muvala wa **{name}** — ndzi ta vutisa ntlawa. Vito ra wena i mani?",
  ss: "Anginaso umbala we-**{name}** — ngizobuza sithimba. Ligama lakho ngubani?",
  ve: "A thi na mmala ha **{name}** — ndi do vhiga tshitshavha. Zwi ita zwine?",
  nr: "Anginayo umbala we-**{name}** — ngizobuza ithimba. Igama lakho ngubani?",
  pt: "Ainda não tenho a cor exacta do **{name}** — vou confirmar com a equipa. Qual é o seu nome?",
};

export const REPLY_PRICE: LangStrings = {
  en: "The **{name}** is listed at **{price}**. I can help with finance pre-approval or a test drive.",
  af: "Die **{name}** is gelys teen **{price}**. Ek kan help met finansiering of 'n toetsrit.",
  zu: "I-**{name}** ibhalwe ngo-**{price}**. Ngingasiza ngemali yangaphambili noma ukushayela.",
  xh: "I-**{name}** ibhalwe ngo-**{price}**. Ndingakunceda ngemali okanye ukushayela.",
  st: "**{name}** e thathamisitsoe ka **{price}**. Nka u thusa ka lichelete kapa tekete ea ho leka.",
  nso: "**{name}** e supilwe ka **{price}**. Ke ka go thuša ka tšhelete goba go leka koloi.",
  tn: "**{name}** e supilwe ka **{price}**. Ke ka go thusa ka madi goba go leka koloi.",
  ts: "**{name}** yi kombisiwile hi **{price}**. Ndzi nga pfuna hi mali kumbe test drive.",
  ss: "Le **{name}** libhalwe nge-**{price}**. Ngingakusita ngemali noma kushayela.",
  ve: "**{name}** i re nga **{price}**. Ndi nga thusa nga finance kana test drive.",
  nr: "I-**{name}** ibhalwe ngo-**{price}**. Ngingakusiza ngemali noma ukushayela.",
  pt: "O **{name}** está listado a **{price}**. Posso ajudar com financiamento ou test drive.",
};

export const REPLY_KM: LangStrings = {
  en: "The **{name}** has **{km}** on the clock.",
  af: "Die **{name}** het **{km}** op die teller.",
  zu: "I-**{name}** ino-**{km}**.",
  xh: "I-**{name}** ino-**{km}**.",
  st: "**{name}** e na le **{km}**.",
  nso: "**{name}** e na le **{km}**.",
  tn: "**{name}** e na le **{km}**.",
  ts: "**{name}** yi na **{km}**.",
  ss: "Le **{name}** lina-**{km}**.",
  ve: "**{name}** i na **{km}**.",
  nr: "I-**{name}** ino-**{km}**.",
  pt: "O **{name}** tem **{km}** no odómetro.",
};

export const REPLY_FUEL: LangStrings = {
  en: "Fuel type: **{fuel}**.",
  af: "Brandstof: **{fuel}**.",
  zu: "Uhlobo lwamafutha: **{fuel}**.",
  xh: "Uhlobo lwamafutha: **{fuel}**.",
  st: "Mofuta: **{fuel}**.",
  nso: "Mafura: **{fuel}**.",
  tn: "Mafura: **{fuel}**.",
  ts: "Mafuta: **{fuel}**.",
  ss: "Umshisa: **{fuel}**.",
  ve: "Mafuta: **{fuel}**.",
  nr: "Amafutha: **{fuel}**.",
  pt: "Combustível: **{fuel}**.",
};

export const REPLY_TRANSMISSION: LangStrings = {
  en: "Transmission: **{transmission}**.",
  af: "Ratkas: **{transmission}**.",
  zu: "Ukudluliswa kwamandla: **{transmission}**.",
  xh: "Ukutshintsha: **{transmission}**.",
  st: "Gearbox: **{transmission}**.",
  nso: "Gearbox: **{transmission}**.",
  tn: "Gearbox: **{transmission}**.",
  ts: "Gearbox: **{transmission}**.",
  ss: "Gearbox: **{transmission}**.",
  ve: "Gearbox: **{transmission}**.",
  nr: "I-gearbox: **{transmission}**.",
  pt: "Transmissão: **{transmission}**.",
};

export const REPLY_LOCATION_KNOWN: LangStrings = {
  en: "You'll find this **{name}** at **{location}**.",
  af: "Jy sal hierdie **{name}** by **{location}** kry.",
  zu: "Uzo**{name}** e-**{location}**.",
  xh: "Ufumana le **{name}** e-**{location}**.",
  st: "U tla fumana **{name}** ho **{location}**.",
  nso: "O tla hwetša **{name}** go **{location}**.",
  tn: "O tla bona **{name}** mo **{location}**.",
  ts: "U ta kuma **{name}** eka **{location}**.",
  ss: "Utawutfola le **{name}** e-**{location}**.",
  ve: "Ni nga wana **{name}** kha **{location}**.",
  nr: "Uzothola le **{name}** e-**{location}**.",
  pt: "Encontrará este **{name}** em **{location}**.",
};

export const REPLY_LOCATION_UNKNOWN: LangStrings = {
  en: "Location isn't listed for this vehicle — I can ask the team. What's your name?",
  af: "Ligging is nie gelys nie — ek kan die span vra. Wat is jou naam?",
  zu: "Indawo ayibhalwanga — ngizobuza ithimba. Igama lakho ngubani?",
  xh: "Indawo ayibhalwanga — ndiza kubuza iqela. Ngubani igama lakho?",
  st: "Sebaka ha se thathamisitsoe — ke tla botsa sehlopha. Lebitso la hao ke mang?",
  nso: "Lefelo ga le sae ngwadišwe — ke tla botsa sehlopha. Leina la gago ke mang?",
  tn: "Lefelo ga le sa ngwadišwe — ke tla botsa sehlopha. Leina la gago ke mang?",
  ts: "Ndawo a yi kombisiwanga — ndzi ta vutisa ntlawa. Vito ra wena i mani?",
  ss: "Indzawo ayibhalwanga — ngizobuza sithimba. Ligama lakho ngubani?",
  ve: "Fhethu ha fho ngadzwaho — ndi do vhiga tshitshavha. Zwi ita zwine?",
  nr: "Indawo ayibhalwanga — ngizobuza ithimba. Igama lakho ngubani?",
  pt: "Localização não indicada — vou confirmar com a equipa. Qual é o seu nome?",
};

export const REPLY_TEST_DRIVE: LangStrings = {
  en: "Tap **Test drive** below and I'll get you booked in for the **{name}**.",
  af: "Tik **Test drive** hieronder en ek reël 'n toetsrit vir die **{name}**.",
  zu: "Chofoza **Test drive** ngezansi ukuze ubhukhe i-**{name}**.",
  xh: "Cofa **Test drive** ngezantsi ukuze ubhukishe i-**{name}**.",
  st: "Tobetsa **Test drive** ka tlase ho beela **{name}**.",
  nso: "Tobetsa **Test drive** ka fase go beela **{name}**.",
  tn: "Tobetsa **Test drive** fa tlase go beela **{name}**.",
  ts: "Click **Test drive** laha hansi ku veka **{name}**.",
  ss: "Chafata **Test drive** ngezansi kubhukha **{name}**.",
  ve: "Dzvanya **Test drive** fhasi u booka **{name}**.",
  nr: "Chofoza **Test drive** ngezansi ukubhukha **{name}**.",
  pt: "Toque em **Test drive** abaixo para marcar o **{name}**.",
};

export const REPLY_FINANCE: LangStrings = {
  en: "Tap **Pre-approval** below for finance on the **{name}** at **{price}**.",
  af: "Tik **Pre-approval** hieronder vir finansiering op die **{name}** teen **{price}**.",
  zu: "Chofoza **Pre-approval** ngezansi ngemali ye-**{name}** ngo-**{price}**.",
  xh: "Cofa **Pre-approval** ngezantsi ngemali ye-**{name}** ngo-**{price}**.",
  st: "Tobetsa **Pre-approval** ka tlase bakeng sa **{name}** ka **{price}**.",
  nso: "Tobetsa **Pre-approval** ka fase bakeng sa **{name}** ka **{price}**.",
  tn: "Tobetsa **Pre-approval** fa tlase bakeng sa **{name}** ka **{price}**.",
  ts: "Click **Pre-approval** laha hansi hi **{name}** hi **{price}**.",
  ss: "Chafata **Pre-approval** ngezansi nge **{name}** nge **{price}**.",
  ve: "Dzvanya **Pre-approval** fhasi nga **{name}** nga **{price}**.",
  nr: "Chofoza **Pre-approval** ngezansi nge **{name}** ngo **{price}**.",
  pt: "Toque em **Pre-approval** para financiar o **{name}** a **{price}**.",
};

export const REPLY_TRADE_IN: LangStrings = {
  en: "Tap **Trade-in value** below — Tumi estimates your current car in seconds.",
  af: "Tik **Trade-in value** hieronder — Tumi skat jou motor binne sekondes.",
  zu: "Chofoza **Trade-in value** ngezansi — uTumi uyakulinganisa imoto yakho.",
  xh: "Cofa **Trade-in value** ngezantsi — uTumi uyakulinganisa imoto yakho.",
  st: "Tobetsa **Trade-in value** ka tlase — Tumi o lekanya koloi ea hao.",
  nso: "Tobetsa **Trade-in value** ka fase — Tumi o lekanya koloi ya gago.",
  tn: "Tobetsa **Trade-in value** fa tlase — Tumi o lekanya koloi ya gago.",
  ts: "Click **Trade-in value** laha hansi — Tumi yi lekanya koloi ya wena.",
  ss: "Chafata **Trade-in value** ngezansi — uTumi uyalinganisa imoto yakho.",
  ve: "Dzvanya **Trade-in value** fhasi — Tumi u kuvhanganya koloi yawe.",
  nr: "Chofoza **Trade-in value** ngezansi — uTumi uyakulinganisa imoto yakho.",
  pt: "Toque em **Trade-in value** — Tumi estima o seu carro em segundos.",
};

export const REPLY_AVAILABILITY: LangStrings = {
  en: "Yes — the **{name}** is currently **available** in our live stock.",
  af: "Ja — die **{name}** wys tans as **beskikbaar** in ons voorraad.",
  zu: "Yebo — i-**{name}** iyatholakala manje esitokisini sethu.",
  xh: "Ewe — i-**{name}** iyafumaneka ngoku.",
  st: "Ee — **{name}** e fumaneha hajoale.",
  nso: "Ee — **{name}** e hwetšagala bjale.",
  tn: "Ee — **{name}** e bonala jaanong.",
  ts: "Ina — **{name}** yi kumeka sweswi.",
  ss: "Yebo — le **{name}** iyatholakala njengamanje.",
  ve: "Ee — **{name}** i wanala zwino.",
  nr: "Yebo — i-**{name}** iyatholakala njengamanje.",
  pt: "Sim — o **{name}** está **disponível** no nosso stock.",
};

export const REPLY_GENERAL: LangStrings = {
  en: "Thanks for your question about the **{name}**. What's your name so the team can follow up?",
  af: "Dankie vir jou vraag oor die **{name}**. Wat is jou naam sodat die span kan opvolg?",
  zu: "Ngiyabonga ngombuzo wakho mayelana ne-**{name}**. Igama lakho ngubani?",
  xh: "Enkosi ngombuzo wakho malunga ne-**{name}**. Ngubani igama lakho?",
  st: "Ke a leboha ka potso ea hao mabapi le **{name}**. Lebitso la hao ke mang?",
  nso: "Ke a leboga ka potšišo ya gago mabapi le **{name}**. Leina la gago ke mang?",
  tn: "Ke a leboga ka potso ya gago mabapi le **{name}**. Leina la gago ke mang?",
  ts: "Ndza khensa hi xivutiso xa wena hi **{name}**. Vito ra wena i mani?",
  ss: "Ngiyabonga ngembuto yakho nge **{name}**. Ligama lakho ngubani?",
  ve: "Ndo livhuwa nga mbudziso yavho nga **{name}**. Zwi ita zwine?",
  nr: "Ngiyathokoza ngombuzo wakho nge **{name}**. Igama lakho ngubani?",
  pt: "Obrigado pela pergunta sobre o **{name}**. Qual é o seu nome?",
};

export function nalaText(
  lang: LanguageCode,
  strings: LangStrings,
  vars: Vars = {},
): string {
  const template = strings[lang] ?? strings.en;
  return fill(template, vars);
}

/** Phrases that signal lead capture is needed (any language) */
export const NAME_REQUEST_MARKERS = [
  "your name", "jou naam", "igama lakho", "igama lakho", "lebitso la hao",
  "leina la gago", "vito ra wena", "ligama lakho", "zwi ita zwine", "seu nome",
  "qual é o seu nome", "wat is jou naam", "ngubani igama",
];

export function replyNeedsNameCapture(reply: string): boolean {
  const lower = reply.toLowerCase();
  return NAME_REQUEST_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}
