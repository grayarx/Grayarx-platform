/**
 * Nala guided-flow prompts — test drive, finance, trade-in, enquiry.
 * All 11 SA official languages + Portuguese.
 */

import { type LanguageCode } from "./languages";
import { nalaText } from "./nalaTranslations";

type LangStrings = Record<LanguageCode, string>;
type Vars = Record<string, string | number | undefined>;

const L = (strings: LangStrings) => strings;

export const FLOW_SETUP_INCOMPLETE = L({
  en: "This dealership hasn't finished setup yet — but I can still take your enquiry. What's your name?",
  af: "Hierdie handelaar het nog nie klaar opgestel nie — maar ek kan steeds jou navraag neem. Wat is jou naam?",
  zu: "Lo mgudli awukakaqedi ukusetha — kodwa ngingathatha umbuzo wakho. Igama lakho ngubani?",
  xh: "Lo rhwebhu alikagqibi ukuseta — kodwa ndingathatha umbuzo wakho. Ngubani igama lakho?",
  st: "Moforoshi enoa ha e so qete ho theha — empa nka nka potso ea hau. Lebitso la hao ke mang?",
  nso: "Moforoshi yo a sa newe go beakwa — eupša ke ka tšea potšišo ya gago. Leina la gago ke mang?",
  tn: "Moforisi o a sa qetse go tlhophwa — mme ke ka tsaya potso ya gago. Leina la gago ke mang?",
  ts: "Xitolo a xi nga heti ku vekiwa — kambe ndzi ta teka xivutiso xa wena. Vito ra wena i mani?",
  ss: "Lomthengisi akakagcwalisi kusetha — kodwa ngingathatha umbuto wakho. Ligama lakho ngubani?",
  ve: "Fhethu ha fho ngo fhedza u ita — fhedzi ndo khou tevhedza mbudziso yavho. Zwi ita zwine?",
  nr: "Lo mthengisi akakagcwalisi ukusetha — kodwa ngingathatha umbuzo wakho. Igama lakho ngubani?",
  pt: "Esta concessionária ainda não concluiu a configuração — mas posso registar o seu pedido. Qual é o seu nome?",
});

export const FLOW_TEST_DRIVE_START = L({
  en: "Great choice! Let's get you behind the wheel. What's your full name?",
  af: "Uitstekende keuse! Kom ons kry jou agter die stuurwiel. Wat is jou volle naam?",
  zu: "Ukukhetha okuhle! Masikusize uqhubeke le moto. Igama lakho eliphelele ngubani?",
  xh: "Ukhetho oluhle! Masikuncede uqhubeke le moto. Ngubani igama lakho eligqibeleleyo?",
  st: "Khetho e ntle! A re u fe monyetla o khanna. Lebitso la hao le felletseng ke mang?",
  nso: "Kgetho e botse! A re go fe tšhono ya go khanna. Leina la gago le feleletšego ke mang?",
  tn: "Kgetho e botse! A re go fe tshono ya go khanna. Leina la gago le feletseng ke mang?",
  ts: "Nhlawulo lowu a wu nene! A hi ku nyika nkarhi wo khoma. Vito ra wena leri heleleke i mani?",
  ss: "Kukhetfa lokuhle! Masikusize uqhubeke le moto. Ligama lakho lephelele ngubani?",
  ve: "Nhluvho nnzhi! Ri do u fa tshikhala tsha u khama. Zwi ita zwine zwo fhelaho?",
  nr: "Ukukhetha okuhle! Masikusize uqhubeke le moto. Igama lakho eligcwele ngubani?",
  pt: "Excelente escolha! Vamos marcar o test drive. Qual é o seu nome completo?",
});

export const FLOW_TEST_DRIVE_CONTACT = L({
  en: "Thanks! What's the best phone number or email to reach you?",
  af: "Dankie! Wat is die beste foonnommer of e-pos om jou te bereik?",
  zu: "Ngiyabonga! Yini inombolo yocingo noma i-imeyili engcono kakhulu?",
  xh: "Enkosi! Yeyiphi inombolo yefowuni okanye i-imeyili efanelekileyo?",
  st: "Ke a leboha! Nomoro ea mohala kapa imeile e metle ke efe?",
  nso: "Ke a leboga! Nomoro ya mogala goba imeile e kaone ke efe?",
  tn: "Ke a leboga! Nomoro ya mogala kgotsa imeile e siameng ke efe?",
  ts: "Ndza khensa! Nomboro ya riqingho kumbe imeyili leyi nga kahle i yihi?",
  ss: "Ngiyabonga! Yini inombolo yocingo noma i-imeyili lelungile?",
  ve: "Ndo livhuwa! Nomboro ya luṱingo kana imeyili ndi yone?",
  nr: "Ngiyathokoza! Yini inombolo yocingo noma i-imeyili engcono?",
  pt: "Obrigado! Qual é o melhor telefone ou e-mail para contacto?",
});

export const FLOW_TEST_DRIVE_DATE = L({
  en: "When would you like to come in? Type a date (YYYY-MM-DD) or say **skip** for the next available slot.",
  af: "Wanneer wil jy kom? Tik 'n datum (JJJJ-MM-DD) of sê **skip** vir die volgende beskikbare tyd.",
  zu: "Ungathanda ukuza nini? Thayipha usuku (YYYY-MM-DD) noma uthi **skip** ukuze uthole isikhathi esilandelayo.",
  xh: "Ungathanda ukuza nini? Chwethetha umhla (YYYY-MM-DD) okanye uthi **skip**.",
  st: "U ka rata ho tla neng? Ngola letsatsi (YYYY-MM-DD) kapa re **skip**.",
  nso: "O ka rata go tla neng? Ngwala letšatši (YYYY-MM-DD) goba re **skip**.",
  tn: "O batla go tla neng? Kwala letsatsi (YYYY-MM-DD) kgotsa re **skip**.",
  ts: "U nga tsakela ku ta rini? Tsala siku (YYYY-MM-DD) kumbe vulavula **skip**.",
  ss: "Ungatsandza kuza nini? Chwetha lilanga (YYYY-MM-DD) noma utsi **skip**.",
  ve: "Ni nga takala u dzula rini? Ngusani dati (YYYY-MM-DD) kana vhudzi **skip**.",
  nr: "Ungathanda ukuza nini? Thayipha usuku (YYYY-MM-DD) noma uthi **skip**.",
  pt: "Quando gostaria de vir? Escreva a data (AAAA-MM-DD) ou diga **skip** para o próximo horário.",
});

export const FLOW_TEST_DRIVE_TIME = L({
  en: "Preferred time? (e.g. 10:00) or say **skip**.",
  af: "Voorkeurtyd? (bv. 10:00) of sê **skip**.",
  zu: "Isikhathi osikhethayo? (isb. 10:00) noma uthi **skip**.",
  xh: "Ixesha olikhethayo? (umz. 10:00) okanye uthi **skip**.",
  st: "Nako eo u e ratang? (mohl. 10:00) kapa re **skip**.",
  nso: "Nako yeo o e ratago? (mohl. 10:00) goba re **skip**.",
  tn: "Nako e o e ratang? (mohl. 10:00) kgotsa re **skip**.",
  ts: "Nkarhi lowu u wu lavaka? (xik. 10:00) kumbe vulavula **skip**.",
  ss: "Sikhatsi losikhetsako? (sib. 10:00) noma utsi **skip**.",
  ve: "Tshifhinga tsha u takala? (swo fana na 10:00) kana vhudzi **skip**.",
  nr: "Isikhathi osikhethako? (isb. 10:00) noma uthi **skip**.",
  pt: "Horário preferido? (ex. 10:00) ou diga **skip**.",
});

export const FLOW_TEST_DRIVE_DONE = L({
  en: "Done! Reference **{ref}**.\n\n{reply}\n\nA consultant at {dealership} will confirm your slot shortly.",
  af: "Klaar! Verwysing **{ref}**.\n\n{reply}\n\n'n Konsultant by {dealership} sal jou tyd binnekort bevestig.",
  zu: "Kwenziwe! Isibonelo **{ref}**.\n\n{reply}\n\nUmcebisi e-{dealership} uzokuqinisekisa isikhathi maduze.",
  xh: "Igqityiwe! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi e-{dealership} uza kuqinisekisa ixesha kungekudala.",
  st: "Ho felile! Nomoro **{ref}**.\n\n{reply}\n\nMokeledi oa {dealership} o tla netefatsa nako haufinyane.",
  nso: "Go fedile! Nomoro **{ref}**.\n\n{reply}\n\nMokgopedi wa {dealership} o tla netefatša nako ka pela.",
  tn: "Go fedile! Nomoro **{ref}**.\n\n{reply}\n\nMokgopedi wa {dealership} o tla netefatsa nako ka bonako.",
  ts: "Ku herile! Nomboro **{ref}**.\n\n{reply}\n\nMupfuni wa {dealership} wu ta tiyisisa nkarhi hi ku hatlisa.",
  ss: "Kuphelile! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi e-{dealership} utawucinisekisa sikhatsi masinyane.",
  ve: "Zwo fhela! Nomboro **{ref}**.\n\n{reply}\n\nMushumi wa {dealership} u do tiyisisa tshifhinga nga u fhambanaho.",
  nr: "Kwenziwe! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi e-{dealership} uzokuqinisekisa isikhathi masinyane.",
  pt: "Concluído! Referência **{ref}**.\n\n{reply}\n\nUm consultor da {dealership} confirmará o horário em breve.",
});

export const FLOW_PRE_APPROVAL_START = L({
  en: "Perfect — I'll help you get pre-approved for the **{vehicle}** at **{price}**. What's your full name?",
  af: "Perfek — ek help jou met voorafgoedkeuring vir die **{vehicle}** teen **{price}**. Wat is jou volle naam?",
  zu: "Kuhle — ngizokusize uthole ukugunyazwa kwangaphambili kwe-**{vehicle}** ngo-**{price}**. Igama lakho eliphelele ngubani?",
  xh: "Kulungile — ndiza kukunceda ufumane imvume kwangaphambili ye-**{vehicle}** ngo-**{price}**. Ngubani igama lakho?",
  st: "Ho lokile — ke tla u thusa ho fumana tumello pele bakeng sa **{vehicle}** ka **{price}**. Lebitso la hao ke mang?",
  nso: "Go lokile — ke tla go thuša go hwetša tumelelo pele ya **{vehicle}** ka **{price}**. Leina la gago ke mang?",
  tn: "Go siame — ke tla go thusa go bona tumelelo pele ya **{vehicle}** ka **{price}**. Leina la gago ke mang?",
  ts: "Swinene — ndzi ta ku pfuna ku kuma mpfumelelo wa le mahlweni wa **{vehicle}** hi **{price}**. Vito ra wena i mani?",
  ss: "Kuhle — ngitakukusita utfole imvume yangaphambili ye-**{vehicle}** nge-**{price}**. Ligama lakho lephelele ngubani?",
  ve: "Zwo nanga — ndi do u thusa u wana thendelo ya u thoma ya **{vehicle}** nga **{price}**. Zwi ita zwine?",
  nr: "Kuhle — ngizokusize uthole imvume yangaphambili ye-**{vehicle}** ngo-**{price}**. Igama lakho eligcwele ngubani?",
  pt: "Perfeito — vou ajudá-lo com a pré-aprovação para o **{vehicle}** a **{price}**. Qual é o seu nome completo?",
});

export const FLOW_PRE_APPROVAL_INCOME = L({
  en: "Approximate monthly net income? (or type **skip**)",
  af: "Benaderde maandelikse netto inkomste? (of tik **skip**)",
  zu: "Imali engenayo yanyanga zonke? (noma thayipha **skip**)",
  xh: "Umvuzo wanyanga? (okanye chwethetha **skip**)",
  st: "Chelete e kenang khoeli le khoeli? (kapa ngola **skip**)",
  nso: "Tšhelete yeo e tsenago kgwedi le kgwedi? (goba ngwala **skip**)",
  tn: "Madi a a tsenang kgwedi le kgwedi? (kgotsa kwala **skip**)",
  ts: "Mali leyi nghenaka hi n'hweti? (kumbe tsala **skip**)",
  ss: "Imali lengenako yanyanga? (noma chwetha **skip**)",
  ve: "Mali i ngaho kha ḓuvha? (kana ngusani **skip**)",
  nr: "Imali engenako yanyanga? (noma thayipha **skip**)",
  pt: "Rendimento líquido mensal aproximado? (ou escreva **skip**)",
});

export const FLOW_PRE_APPROVAL_DEPOSIT = L({
  en: "Deposit amount you'd like to put down? (or **skip**)",
  af: "Deposito wat jy wil betaal? (of **skip**)",
  zu: "Imali oyifakayo? (noma **skip**)",
  xh: "Idiphozithi oyifunayo? (okanye **skip**)",
  st: "Chelete ea depoite? (kapa **skip**)",
  nso: "Tšhelete ya depoite? (goba **skip**)",
  tn: "Madi a depoite? (kgotsa **skip**)",
  ts: "Mali ya depoziti? (kumbe **skip**)",
  ss: "Imali yediphozithi? (noma **skip**)",
  ve: "Mali ya depoziti? (kana **skip**)",
  nr: "Imali yediphozithi? (noma **skip**)",
  pt: "Valor do depósito? (ou **skip**)",
});

export const FLOW_PRE_APPROVAL_TERM = L({
  en: "Finance term in months? (e.g. 60, or **skip**)",
  af: "Finansieringstermyn in maande? (bv. 60, of **skip**)",
  zu: "Isikhathi sezinyanga? (isb. 60, noma **skip**)",
  xh: "Ixesha leenyanga? (umz. 60, okanye **skip**)",
  st: "Nako ka likhoeli? (mohl. 60, kapa **skip**)",
  nso: "Nako ka dikgwedi? (mohl. 60, goba **skip**)",
  tn: "Nako ka dikgwedi? (mohl. 60, kgotsa **skip**)",
  ts: "Nkarhi hi tinhweti? (xik. 60, kumbe **skip**)",
  ss: "Sikhatsi seminyaka? (sib. 60, noma **skip**)",
  ve: "Tshifhinga tsha miṅwaha? (swo fana na 60, kana **skip**)",
  nr: "Isikhathi sezinyanga? (isb. 60, noma **skip**)",
  pt: "Prazo em meses? (ex. 60, ou **skip**)",
});

export const FLOW_PRE_APPROVAL_DONE = L({
  en: "Application received! Reference **{ref}**.\n\n{reply}\n\nA finance consultant will review this personally — no automated approval.",
  af: "Aansoek ontvang! Verwysing **{ref}**.\n\n{reply}\n\n'n Finansieringskonsultant sal dit persoonlik hersien.",
  zu: "Isicelo samukelwe! Isibonelo **{ref}**.\n\n{reply}\n\nUmcebisi wezimali uzokuhlola mathupha.",
  xh: "Isicelo samkelwe! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi wezimali uza kuyihlola.",
  st: "Kopo e amohetsoe! Nomoro **{ref}**.\n\n{reply}\n\nMokeledi oa lichelete o tla e hlahloba ka bomong.",
  nso: "Kgopelo e amogetšwe! Nomoro **{ref}**.\n\n{reply}\n\nMokgopedi wa ditšhelete o tla e hlahloba ka bowena.",
  tn: "Kopo e amogetswe! Nomoro **{ref}**.\n\n{reply}\n\nMokgopedi wa madi o tla e sekaseka ka bowe.",
  ts: "Xikombelo xi amukeriwile! Nomboro **{ref}**.\n\n{reply}\n\nMupfuni wa mali wu ta yi languta hi voko.",
  ss: "Sicelo semukelwe! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi wemali utawuyihlola.",
  ve: "Khumbelo yo dzhielwa! Nomboro **{ref}**.\n\n{reply}\n\nMushumi wa mali u do i sedza vhukuma.",
  nr: "Isicelo samukelwe! Inombolo **{ref}**.\n\n{reply}\n\nUmcebisi wezimali uzokuhlola mathupha.",
  pt: "Pedido recebido! Referência **{ref}**.\n\n{reply}\n\nUm consultor financeiro analisará pessoalmente.",
});

export const FLOW_TRADE_IN_START = L({
  en: "Tumi can estimate your current car's value in seconds. What's the **make** of your trade-in? (e.g. Toyota)",
  af: "Tumi kan jou motor se waarde skat. Wat is die **handelsmerk**? (bv. Toyota)",
  zu: "UTumi angalinganisa inani lemoto yakho. **Umkhiqizi** wemoto yakho uyini? (isb. Toyota)",
  xh: "UTumi angalinganisa ixabiso lemoto yakho. **Umenzi** wemoto uyintoni? (umz. Toyota)",
  st: "Tumi a ka lekanya boleng ba koloi ea hau. **Mofani** ke mang? (mohl. Toyota)",
  nso: "Tumi a ka lekanya boleng bja koloi ya gago. **Mofani** ke mang? (mohl. Toyota)",
  tn: "Tumi a ka lekanya boleng jwa koloi ya gago. **Mofani** ke mang? (mohl. Toyota)",
  ts: "Tumi a nga lekanya nxavo wa movha wa wena. **Muaki** i mani? (xik. Toyota)",
  ss: "UTumi angalinganisa inani lemoto yakho. **Umenzi** ngubani? (sib. Toyota)",
  ve: "Tumi a nga kala ndengo ya movha yavho. **Mushumi** ndi ani? (swo fana na Toyota)",
  nr: "UTumi angalinganisa inani lemoto yakho. **Umkhiqizi** ngubani? (isb. Toyota)",
  pt: "A Tumi pode estimar o valor do seu carro. Qual é a **marca**? (ex. Toyota)",
});

export const FLOW_TRADE_IN_MODEL = L({
  en: "Model?",
  af: "Model?",
  zu: "Imodeli?",
  xh: "Imodeli?",
  st: "Mohlala?",
  nso: "Mohlala?",
  tn: "Mohlala?",
  ts: "Xikombiso?",
  ss: "Imodeli?",
  ve: "Modhele?",
  nr: "Imodeli?",
  pt: "Modelo?",
});

export const FLOW_TRADE_IN_MODEL_CONFIRM = L({
  en: "**{value}** — model?",
  af: "**{value}** — model?",
  zu: "**{value}** — imodeli?",
  xh: "**{value}** — imodeli?",
  st: "**{value}** — mohlala?",
  nso: "**{value}** — mohlala?",
  tn: "**{value}** — mohlala?",
  ts: "**{value}** — xikombiso?",
  ss: "**{value}** — imodeli?",
  ve: "**{value}** — modhele?",
  nr: "**{value}** — imodeli?",
  pt: "**{value}** — modelo?",
});

export const FLOW_TRADE_IN_YEAR = L({
  en: "Year?",
  af: "Jaar?",
  zu: "Unyaka?",
  xh: "Unyaka?",
  st: "Selemo?",
  nso: "Selemo?",
  tn: "Ngwaga?",
  ts: "Lembe?",
  ss: "Leminyaka?",
  ve: "Tshikolo?",
  nr: "Unyaka?",
  pt: "Ano?",
});

export const FLOW_TRADE_IN_YEAR_CONFIRM = L({
  en: "**{value}** — year?",
  af: "**{value}** — jaar?",
  zu: "**{value}** — unyaka?",
  xh: "**{value}** — unyaka?",
  st: "**{value}** — selemo?",
  nso: "**{value}** — selemo?",
  tn: "**{value}** — ngwaga?",
  ts: "**{value}** — lembe?",
  ss: "**{value}** — leminyaka?",
  ve: "**{value}** — tshikolo?",
  nr: "**{value}** — unyaka?",
  pt: "**{value}** — ano?",
});

export const FLOW_TRADE_IN_KM = L({
  en: "Mileage in km?",
  af: "Kilometerstand?",
  zu: "Ibanga eliqhutshwe ngamakhilomitha?",
  xh: "Umgama ngamakhilomitha?",
  st: "Melele ea lik'hilomithara?",
  nso: "Melelo ya dikhilomithara?",
  tn: "Maele a dikhilomithara?",
  ts: "Mamiliya hi tikhilomithara?",
  ss: "Ibanga ngamakhilomitha?",
  ve: "Maele a tikhilomithara?",
  nr: "Ibanga ngamakhilomitha?",
  pt: "Quilometragem?",
});

export const FLOW_TRADE_IN_CONDITION = L({
  en: "Condition? (**excellent**, **good**, **fair**, or **poor**)",
  af: "Toestand? (**excellent**, **good**, **fair**, of **poor**)",
  zu: "Isimo? (**excellent**, **good**, **fair**, noma **poor**)",
  xh: "Imeko? (**excellent**, **good**, **fair**, okanye **poor**)",
  st: "Boemo? (**excellent**, **good**, **fair**, kapa **poor**)",
  nso: "Maemo? (**excellent**, **good**, **fair**, goba **poor**)",
  tn: "Maemo? (**excellent**, **good**, **fair**, kgotsa **poor**)",
  ts: "Xiyimo? (**excellent**, **good**, **fair**, kumbe **poor**)",
  ss: "Simo? (**excellent**, **good**, **fair**, noma **poor**)",
  ve: "Tshiimo? (**excellent**, **good**, **fair**, kana **poor**)",
  nr: "Isimo? (**excellent**, **good**, **fair**, noma **poor**)",
  pt: "Estado? (**excellent**, **good**, **fair**, ou **poor**)",
});

export const FLOW_TRADE_IN_DONE = L({
  en: "Here's Tumi's estimate for your **{year} {make} {model}**:\n\n**{low}** – **{high}** (mid: {mid})\n\nWant to book a test drive in the **{vehicle}**?",
  af: "Hier is Tumi se skatting vir jou **{year} {make} {model}**:\n\n**{low}** – **{high}** (mid: {mid})\n\nWil jy 'n toetsrit in die **{vehicle}** bespreek?",
  zu: "Nansi yesilinganiso sikaTumi se-**{year} {make} {model}**:\n\n**{low}** – **{high}** (phakathi: {mid})\n\nUfuna ukubhukha ukuqhuba i-**{vehicle}**?",
  xh: "Nantsi ingxelo kaTumi ye-**{year} {make} {model}**:\n\n**{low}** – **{high}** (phakathi: {mid})\n\nUfuna ukubhukisha ukuqhuba i-**{vehicle}**?",
  st: "Mona ke tekanyo ea Tumi ea **{year} {make} {model}**:\n\n**{low}** – **{high}** (bohareng: {mid})\n\nU batla ho behela teko ea **{vehicle}**?",
  nso: "Mona ke tekanyo ya Tumi ya **{year} {make} {model}**:\n\n**{low}** – **{high}** (bogareng: {mid})\n\nO nyaka go bea teko ya **{vehicle}**?",
  tn: "Fano ke tekanyo ya Tumi ya **{year} {make} {model}**:\n\n**{low}** – **{high}** (bogareng: {mid})\n\nO batla go bea teko ya **{vehicle}**?",
  ts: "Leswi i xiringanyeto xa Tumi xa **{year} {make} {model}**:\n\n**{low}** – **{high}** (exikarhi: {mid})\n\nU lava ku veka nkarhi wo khama **{vehicle}**?",
  ss: "Nansi yesilinganiso sikaTumi se-**{year} {make} {model}**:\n\n**{low}** – **{high}** (phakathi: {mid})\n\nUfuna kubhukha ukuqhuba i-**{vehicle}**?",
  ve: "Hee ndi linganiso ya Tumi ya **{year} {make} {model}**:\n\n**{low}** – **{high}** (vhukati: {mid})\n\nNi nga takala u vhuedza **{vehicle}**?",
  nr: "Nansi ingxelo kaTumi ye-**{year} {make} {model}**:\n\n**{low}** – **{high}** (phakathi: {mid})\n\nUfuna ukubhukha ukuqhuba i-**{vehicle}**?",
  pt: "Estimativa da Tumi para o seu **{year} {make} {model}**:\n\n**{low}** – **{high}** (média: {mid})\n\nQuer marcar test drive no **{vehicle}**?",
});

export const FLOW_ENQUIRY_START = L({
  en: "Sure — what's your question about this vehicle? I'll pass it to the team.",
  af: "Seker — wat is jou vraag oor hierdie motor? Ek stuur dit vir die span.",
  zu: "Kulungile — yini umbuzo wakho mayelana nale moto? Ngizokudlulisela ithimba.",
  xh: "Kulungile — yintoni umbuzo wakho malunga nale moto? Ndiza kuyidlulisela iqela.",
  st: "Ho lokile — potso ea hau mabapi le koloi ena ke efe? Ke tla e fetisetsa sehlopheng.",
  nso: "Go lokile — potšišo ya gago mabapi le koloi ye ke efe? Ke tla e fetišetša sehlopheng.",
  tn: "Go siame — potso ya gago mabapi le koloi e ke efe? Ke tla e fetisetsa sehlopheng.",
  ts: "Swinene — xivutiso xa wena hi movha lowu i yihi? Ndzi ta xi rhumela eka ntlawa.",
  ss: "Kulungile — yini umbuto wakho mayelana nale moto? Ngitawudlulisa ethimeni.",
  ve: "Zwo nanga — mbudziso yavho nga movha hee i mini? Ndo rumela tshitshavha.",
  nr: "Kulungile — yini umbuzo wakho mayelana nale moto? Ngizokudlulisa ithimba.",
  pt: "Claro — qual é a sua pergunta sobre este veículo? Vou encaminhar à equipa.",
});

export const FLOW_ERROR_GENERIC = L({
  en: "Sorry, something went wrong. Try again or pick an option below.",
  af: "Jammer, iets het verkeerd geloop. Probeer weer of kies 'n opsie hieronder.",
  zu: "Uxolo, kukhona okungahambanga kahle. Zama futhi noma ukhethe inketho ngezansi.",
  xh: "Uxolo, kukho into engahambanga kakuhle. Zama kwakhona okanye khetha ngezantsi.",
  st: "Maswabi, ho na le phoso. Leka hape kapa khetha khetho ka tlase.",
  nso: "Maswabi, go na le phošo. Leka gape goba kgetha ka fase.",
  tn: "Maswabi, go na le phoso. Leka gape kgotsa kgetha fa tlase.",
  ts: "Ku tisola, ku na xiphiqo. Ringeta nakambe kumbe hlawula laha hansi.",
  ss: "Siyacolisa, kukhona lokungahambanga kahle. Zama futsi noma ukhetse ngezansi.",
  ve: "Ndi khou vhiga, ho na thaidzo. Lingedza hafhu kana nangani nga fhasi.",
  nr: "Uxolo, kukhona okungahambanga kahle. Zama futhi noma ukhethe ngezansi.",
  pt: "Desculpe, algo correu mal. Tente novamente ou escolha uma opção abaixo.",
});

export const FLOW_ERROR_SUBMIT = L({
  en: "Sorry: {message}",
  af: "Jammer: {message}",
  zu: "Uxolo: {message}",
  xh: "Uxolo: {message}",
  st: "Maswabi: {message}",
  nso: "Maswabi: {message}",
  tn: "Maswabi: {message}",
  ts: "Ku tisola: {message}",
  ss: "Siyacolisa: {message}",
  ve: "Ndi khou vhiga: {message}",
  nr: "Uxolo: {message}",
  pt: "Desculpe: {message}",
});

export const FLOW_WORKING = L({
  en: "Working on it…",
  af: "Besig daarmee…",
  zu: "Ngiyasebenza…",
  xh: "Ndisebenza…",
  st: "Ke sebetsa…",
  nso: "Ke a šoma…",
  tn: "Ke a dira…",
  ts: "Ndzi ri karhi ndzi tirha…",
  ss: "Ngiyasebenta…",
  ve: "Ndi khou shuma…",
  nr: "Ngiyasebenza…",
  pt: "A processar…",
});

export const FLOW_INPUT_MENU = L({
  en: "Or type a message…",
  af: "Of tik 'n boodskap…",
  zu: "Noma thayipha umlayezo…",
  xh: "Okanye chwethetha umyalezo…",
  st: "Kapa ngola molaetsa…",
  nso: "Goba ngwala molaetša…",
  tn: "Kgotsa kwala molaetsa…",
  ts: "Kumbe tsala rungula…",
  ss: "Noma chwetha umlayeto…",
  ve: "Kana ngusani mulaedza…",
  nr: "Noma thayipha umlayezo…",
  pt: "Ou escreva uma mensagem…",
});

export const FLOW_INPUT_REPLY = L({
  en: "Type your reply…",
  af: "Tik jou antwoord…",
  zu: "Thayipha impendulo yakho…",
  xh: "Chwethetha impendulo yakho…",
  st: "Ngola karabo ea hau…",
  nso: "Ngwala karabo ya gago…",
  tn: "Kwala karabo ya gago…",
  ts: "Tsala nhlamulo ya wena…",
  ss: "Chwetha impendvulo yakho…",
  ve: "Ngusani nhlamulo yavho…",
  nr: "Thayipha impendulo yakho…",
  pt: "Escreva a sua resposta…",
});

export const QUICK_TEST_DRIVE = L({
  en: "Test drive", af: "Toetsrit", zu: "Ukuqhuba", xh: "Uvavanyo", st: "Teko ea ho khanna",
  nso: "Teko ya go khanna", tn: "Teko ya go khanna", ts: "Nkarhi wo khama", ss: "Kuhambisa",
  ve: "U khama", nr: "Ukuqhuba", pt: "Test drive",
});

export const QUICK_PRE_APPROVAL = L({
  en: "Pre-approval", af: "Voorafgoedkeuring", zu: "Ukugunyazwa", xh: "Imvume", st: "Tumello pele",
  nso: "Tumelelo pele", tn: "Tumelelo pele", ts: "Mpfuno wa mali", ss: "Imvume",
  ve: "Thendelo", nr: "Imvume", pt: "Pré-aprovação",
});

export const QUICK_TRADE_IN = L({
  en: "Trade-in value", af: "Inruilwaarde", zu: "Inani lokushintsha", xh: "Ixabiso lokutshintsha",
  st: "Boleng ba ho fapanyetsa", nso: "Boleng bja go fapanyetša", tn: "Boleng jwa go fapanyetsa",
  ts: "Nxavo wa ku cinca", ss: "Inani lekushintja", ve: "Ndengo ya u shandukisa",
  nr: "Inani lokushintsha", pt: "Valor de retoma",
});

export const QUICK_ASK = L({
  en: "Ask a question", af: "Vra 'n vraag", zu: "Buza umbuzo", xh: "Buza umbuzo", st: "Botsa potso",
  nso: "Botsa potšišo", tn: "Botsa potso", ts: "Vutisa xivutiso", ss: "Buza umbuto",
  ve: "Bvudza mbudziso", nr: "Buza umbuzo", pt: "Fazer pergunta",
});

/** Words customers may use instead of "skip" */
export const SKIP_REPLY_WORDS = [
  "skip", "sla oor", "overslaan", "yebo", "qhubeka", "tshiya", "tlogela", "tshika",
  "sala", "pula", "pular", "salta", "pass", "next", "geen", "niks",
];

export type FlowPromptKey =
  | "setupIncomplete"
  | "testDriveStart"
  | "testDriveContact"
  | "testDriveDate"
  | "testDriveTime"
  | "testDriveDone"
  | "preApprovalStart"
  | "preApprovalIncome"
  | "preApprovalDeposit"
  | "preApprovalTerm"
  | "preApprovalDone"
  | "tradeInStart"
  | "tradeInModel"
  | "tradeInModelConfirm"
  | "tradeInYear"
  | "tradeInYearConfirm"
  | "tradeInKm"
  | "tradeInCondition"
  | "tradeInDone"
  | "enquiryStart"
  | "errorGeneric"
  | "errorSubmit"
  | "working"
  | "inputMenu"
  | "inputReply"
  | "quickTestDrive"
  | "quickPreApproval"
  | "quickTradeIn"
  | "quickAsk";

const FLOW_MAP: Record<FlowPromptKey, LangStrings> = {
  setupIncomplete: FLOW_SETUP_INCOMPLETE,
  testDriveStart: FLOW_TEST_DRIVE_START,
  testDriveContact: FLOW_TEST_DRIVE_CONTACT,
  testDriveDate: FLOW_TEST_DRIVE_DATE,
  testDriveTime: FLOW_TEST_DRIVE_TIME,
  testDriveDone: FLOW_TEST_DRIVE_DONE,
  preApprovalStart: FLOW_PRE_APPROVAL_START,
  preApprovalIncome: FLOW_PRE_APPROVAL_INCOME,
  preApprovalDeposit: FLOW_PRE_APPROVAL_DEPOSIT,
  preApprovalTerm: FLOW_PRE_APPROVAL_TERM,
  preApprovalDone: FLOW_PRE_APPROVAL_DONE,
  tradeInStart: FLOW_TRADE_IN_START,
  tradeInModel: FLOW_TRADE_IN_MODEL,
  tradeInModelConfirm: FLOW_TRADE_IN_MODEL_CONFIRM,
  tradeInYear: FLOW_TRADE_IN_YEAR,
  tradeInYearConfirm: FLOW_TRADE_IN_YEAR_CONFIRM,
  tradeInKm: FLOW_TRADE_IN_KM,
  tradeInCondition: FLOW_TRADE_IN_CONDITION,
  tradeInDone: FLOW_TRADE_IN_DONE,
  enquiryStart: FLOW_ENQUIRY_START,
  errorGeneric: FLOW_ERROR_GENERIC,
  errorSubmit: FLOW_ERROR_SUBMIT,
  working: FLOW_WORKING,
  inputMenu: FLOW_INPUT_MENU,
  inputReply: FLOW_INPUT_REPLY,
  quickTestDrive: QUICK_TEST_DRIVE,
  quickPreApproval: QUICK_PRE_APPROVAL,
  quickTradeIn: QUICK_TRADE_IN,
  quickAsk: QUICK_ASK,
};

export function getFlowPrompt(
  key: FlowPromptKey,
  lang: LanguageCode,
  vars: Vars = {},
): string {
  return nalaText(lang, FLOW_MAP[key], vars);
}

export function isSkipReply(text: string): boolean {
  const t = text.trim().toLowerCase();
  return SKIP_REPLY_WORDS.some((w) => t === w || new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t));
}
