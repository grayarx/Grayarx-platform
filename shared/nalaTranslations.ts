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
  ve: "Ndo rumela tshitshavha. Dzina lavho ndi ani?",
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
  en: "Anything else I can help you with about this one?",
  af: "Is daar nog iets oor hierdie motor wat ek vir jou kan uitklaar?",
  zu: "Ingabe kukhona okunye okufunayo ngale moto?",
  xh: "Ingaba kukho enye into ofuna ukuyazi ngale moto?",
  st: "Ho na le se seng se seng mabapi le koloi ena?",
  nso: "Go na le se sengwe ka koloi ye o nyakago go se tseba?",
  tn: "A go na le se sengwe ka koloi eno o se batlang go itse?",
  ts: "Ku na na xin'wana eka xitirho lexi u lavaka ku xi tiva?",
  ss: "Ingabe kukhona okunye ngale moto ufuna kukwati?",
  ve: "Hu na zwiṅwe nga khathini iyi zwine u tenda u zwi pfesesa?",
  nr: "Ingabe kukhona okunye okufunayo ngale moto?",
  pt: "Há mais alguma coisa que queira saber sobre este carro?",
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
  ve: "**{name}** i re nga **{color}**. Ni funa u bulokha u linga u shumisa?",
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
  ve: "A thi na mmala ha **{name}** — ndi do vhiga tshitshavha. Dzina lavho ndi ani?",
  nr: "Anginayo umbala we-**{name}** — ngizobuza ithimba. Igama lakho ngubani?",
  pt: "Ainda não tenho a cor exacta do **{name}** — vou confirmar com a equipa. Qual é o seu nome?",
};

export const REPLY_PRICE: LangStrings = {
  en: "The **{name}** is listed at **{price}**.\n\nWant a viewing this week, or finance pre-approval against that price?",
  af: "Die **{name}** is gelys teen **{price}**.\n\nWil jy 'n toetsrit hierdie week, of finansiering teen daardie prys?",
  zu: "I-**{name}** ibhalwe ngo-**{price}**.\n\nUfuna ukubona kulo sonto, noma imali yangaphambili ngaleyo ntengo?",
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
  en: "The **{name}** has **{km}** on the clock.\n\nStill on the floor — want to come see it?",
  af: "Die **{name}** het **{km}** op die teller.\n\nDis op die vloer — wil jy kom kyk?",
  zu: "I-**{name}** ino-**{km}**.\n\nIsesitokisini — ufuna ukuyibona?",
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
  en: "The **{name}** is **{fuel}**, listed at **{price}**.\n\nWant a viewing, or finance against that price?",
  af: "Die **{name}** is **{fuel}**, gelys teen **{price}**.\n\nWil jy kom kyk, of finansiering teen daardie prys?",
  zu: "I-**{name}** ingu-**{fuel}**, ibhalwe ngo-**{price}**.\n\nUfuna ukuyibona, noma imali ngaleyo ntengo?",
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
  en: "The **{name}** is **{transmission}**.\n\nWant a viewing to feel it on the road?",
  af: "Die **{name}** is **{transmission}**.\n\nWil jy 'n toetsrit om dit op die pad te voel?",
  zu: "I-**{name}** ingu-**{transmission}**.\n\nUfuna ukuyishayela ukuze uzwe emgwaqeni?",
  xh: "Ukutshintsha: **{transmission}**.",
  st: "Sebopeho sa gear: **{transmission}**.",
  nso: "Sebopešo sa gear: **{transmission}**.",
  tn: "Mokgwa wa gear: **{transmission}**.",
  ts: "Gear ya ku cinca: **{transmission}**.",
  ss: "I-gearbox: **{transmission}**.",
  ve: "Gearbox ya u shandukisa: **{transmission}**.",
  nr: "I-gearbox: **{transmission}**.",
  pt: "Transmissão: **{transmission}**.",
};

export const REPLY_LOCATION_KNOWN: LangStrings = {
  en: "You'll find this **{name}** at **{location}**.\n\nReply with a day that works and I'll lock a viewing.",
  af: "Jy sal hierdie **{name}** by **{location}** kry.\n\nStuur 'n dag wat werk en ek sluit 'n toetsrit.",
  zu: "Uzothola i-**{name}** e-**{location}**.\n\nThumela usuku olukusebenzayo ngizokubhukhela ukuyibona.",
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
  ve: "Fhethu ha fho ngadzwaho — ndi do vhiga tshitshavha. Dzina lavho ndi ani?",
  nr: "Indawo ayibhalwanga — ngizobuza ithimba. Igama lakho ngubani?",
  pt: "Localização não indicada — vou confirmar com a equipa. Qual é o seu nome?",
};

export const REPLY_TEST_DRIVE: LangStrings = {
  en: "I can book a viewing for the **{name}**.\n\nReply with a day and time that works — evenings and weekends are fine — or tap **Test drive** if you see it.",
  af: "Ek kan 'n toetsrit reël vir die **{name}**.\n\nStuur 'n dag en tyd wat werk — aand en naweke is reg — of tik **Test drive** as jy dit sien.",
  zu: "Ngingakubhukhela ukubona i-**{name}**.\n\nThumela usuku nesikhathi — kusihlwa namaholide kulungile — noma chofoza **Test drive** uma ukubona.",
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
  en: "Finance is available on the **{name}** at **{price}**.\n\nReply with a monthly budget, or tap **Pre-approval** and I'll start the form.",
  af: "Finansiering is beskikbaar op die **{name}** teen **{price}**.\n\nStuur 'n maandelikse begroting, of tik **Pre-approval** en ek begin die vorm.",
  zu: "Imali iyatholakala ku-**{name}** ngo-**{price}**.\n\nThumela isabelomali senyanga, noma chofoza **Pre-approval** ngizoqala ifomu.",
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
  en: "Send make, model, year and km and Tumi will estimate your trade-in — or tap **Trade-in value** if you see it.",
  af: "Stuur merk, model, jaar en km en Tumi skat jou ruilwaarde — of tik **Trade-in value** as jy dit sien.",
  zu: "Thumela uhlobo, imodeli, unyaka ne-km uTumi azolinganisela intengo yokuguqula — noma chofoza **Trade-in value** uma ukubona.",
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
  en: "Yes — the **{name}** is on the floor now, listed at **{price}**.\n\nReply with a day that works and I'll lock a viewing.",
  af: "Ja — die **{name}** is nou op die vloer, gelys teen **{price}**.\n\nStuur 'n dag wat werk en ek sluit 'n toetsrit.",
  zu: "Yebo — i-**{name}** isesitokisini manje, ibhalwe ngo-**{price}**.\n\nThumela usuku olukusebenzayo ngizokubhukhela ukuyibona.",
  xh: "Ewe — i-**{name}** iyafumaneka ngoku ngo-**{price}**.\n\nThumela usuku olusebenzayo ndiza kukubhukishela ukuyibona.",
  st: "Ee — **{name}** e fumaneha hajoale ka **{price}**.\n\nRomela letsatsi le sebetsang ke tla u beela ho e bona.",
  nso: "Ee — **{name}** e hwetšagala bjale ka **{price}**.\n\nRomela letšatši le šomago ke tla go beela go e bona.",
  tn: "Ee — **{name}** e bonala jaanong ka **{price}**.\n\nRomela letsatsi le le dirang ke tla go beela go e bona.",
  ts: "Ina — **{name}** yi kumeka sweswi hi **{price}**.\n\nRhumela siku leri tirhaka ndzi ta ku veka ku yi vona.",
  ss: "Yebo — le **{name}** iyatholakala njengamanje nge-**{price}**.\n\nThumela lusuku lolusebentako ngitawukubhukhela kuyibona.",
  ve: "Ee — **{name}** i wanala zwino nga **{price}**.\n\nRumela ḓuvha ḽine ḽa shuma ndi ḓo u bulokha u ḽi vhona.",
  nr: "Yebo — i-**{name}** iyatholakala njengamanje ngo-**{price}**.\n\nThumela ilanga elisebenzayo ngizokubhukhela ukuyibona.",
  pt: "Sim — o **{name}** está no piso agora, listado a **{price}**.\n\nDiga um dia que lhe sirva e marco a visita.",
};

export const REPLY_GENERAL: LangStrings = {
  en: "The **{name}** is listed at **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nIt's on the floor. Want a viewing, finance, or a trade-in figure?",
  af: "Die **{name}** is gelys teen **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nDis op die vloer. Wil jy kom kyk, finansiering, of 'n ruilwaarde?",
  zu: "I-**{name}** ibhalwe ngo-**{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nIsesitokisini. Ufuna ukuyibona, imali, noma intengo yokuguqula?",
  xh: "I-**{name}** ibhalwe ngo-**{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nIyafumaneka. Ufuna ukuyibona, imali, okanye ixabiso lokutshintsha?",
  st: "**{name}** e thathamisitsoe ka **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nE teng. U batla ho e bona, lichelete, kapa theko ea ho rekiša?",
  nso: "**{name}** e supilwe ka **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nE gona. O nyaka go e bona, tšhelete, goba theko ya go rekiša?",
  tn: "**{name}** e supilwe ka **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nE teng. O batla go e bona, madi, kgotsa theko ya go rekisa?",
  ts: "**{name}** yi kombisiwile hi **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nYi kona. U lava ku yi vona, mali, kumbe nxavo wa ku hoxisa?",
  ss: "Le **{name}** libhalwe nge-**{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nIyatholakala. Ufuna kuyibona, imali, noma intengo yekugucula?",
  ve: "**{name}** i re nga **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nI hone. Ni funa u i vhona, tshelede, kana theko ya u shandukisa?",
  nr: "I-**{name}** ibhalwe ngo-**{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nIyatholakala. Ufuna ukuyibona, imali, noma intengo yokuguqula?",
  pt: "O **{name}** está listado a **{price}** — **{km}**, **{fuel}**, **{transmission}**.\n\nEstá no piso. Quer uma visita, financiamento ou valor de troca?",
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
  "your name", "jou naam", "igama lakho", "lebitso la hao",
  "leina la gago", "vito ra wena", "ligama lakho", "dzina lavho", "seu nome",
  "qual é o seu nome", "wat is jou naam", "ngubani igama",
];

export function replyNeedsNameCapture(reply: string): boolean {
  const lower = reply.toLowerCase();
  return NAME_REQUEST_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}
