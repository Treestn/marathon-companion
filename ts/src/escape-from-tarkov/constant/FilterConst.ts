// ====== Types ======
export interface Locales {
  en?: string;
  cs?: string; de?: string; es?: string; fr?: string; hu?: string;
  it?: string; ja?: string; ko?: string; pl?: string; pt?: string;
  ro?: string; ru?: string; sk?: string; tr?: string; zh?: string;
}

export type Filter = { name: string; child: ChildFilter[], locales: Locales };
export type FilterDict = Record<string, Filter>;
export type ChildFilter = { name: string; locales: Locales };

export const LootConst = {
  VALUABLE:     { name: 'Valuable',     locales: { en:'Valuable',     cs:'Cennosti', de:'Wertsachen', es:'Valiosos', fr:'Précieux', hu:'Értékek', it:'Preziosi', ja:'貴重品', ko:'귀중품', pl:'Wartościowe', pt:'Valiosos', ro:'Valoroase', ru:'Ценности', sk:'Cennosti', tr:'Değerli', zh:'贵重物品' } },
  AMMO_CRATE:   { name: 'Ammo Crate',   locales: { en:'Ammo Crate',   cs:'Bedna munice', de:'Munitionskiste', es:'Caja de munición', fr:'Boîte de munitions', hu:'Lőszerláda', it:'Cassetta munizioni', ja:'弾薬箱', ko:'탄약 상자', pl:'Skrzynia amunicji', pt:'Caixa de munição', ro:'Cutie de muniție', ru:'Ящик с патронами', sk:'Debna munície', tr:'Mühimmat kutusu', zh:'弹药箱' } },
  ARC_COURIER:  { name: 'Arc Courier',        locales: { en:'Arc Courier',        cs:'Skrýš', de:'Versteck', es:'Alijo', fr:'Cache', hu:'Rejtek', it:'Nascondiglio', ja:'隠しスタッシュ', ko:'은닉처', pl:'Skrytka', pt:'Esconderijo', ro:'Ascunzătoare', ru:'Тайник', sk:'Skrýša', tr:'Zula', zh:'隐藏藏匿处' } },
  BARON_HUSK:   { name: 'Baron Husk',   locales: { en:'Baron Husk',   cs:'Baron Husk', de:'Baron Husk', es:'Baron Husk', fr:'Baron Husk', hu:'Baron Husk', it:'Baron Husk', ja:'バロンハスク', ko:'바론 허스크', pl:'Baron Husk', pt:'Baron Husk', ro:'Baron Husk', ru:'Baron Husk', sk:'Baron Husk', tr:'Baron Husk', zh:'巴伦·哈斯克' } },
  CAR:          { name: 'Car',     locales: { en:'Car',     cs:'Auto', de:'Auto', es:'Coche', fr:'Voiture', hu:'Autó', it:'Auto', ja:'車', ko:'차', pl:'Samochód', pt:'Carro', ro:'Mașină', ru:'Автомобиль', sk:'Auto', tr:'Araba', zh:'汽车' } },
  FIELD_CRATE:    { name: 'Field Crate',    locales: { en:'Field Crate',    cs:'Field Crate', de:'Field Crate', es:'Field Crate', fr:'Field Crate', hu:'Field Crate', it:'Field Crate', ja:'Field Crate', ko:'Field Crate', pl:'Field Crate', pt:'Field Crate', ro:'Field Crate', ru:'Field Crate', sk:'Field Crate', tr:'Field Crate', zh:'Field Crate' } },
  LOCKERS:       { name: 'Lockers',       locales: { en:'Lockers',       cs:'Zásuvka', de:'Schublade', es:'Cajón', fr:'Tiroir', hu:'Fiók', it:'Cassetto', ja:'引き出し', ko:'서랍', pl:'Szuflada', pt:'Gaveta', ro:'Sertar', ru:'Ящик', sk:'Zásuvka', tr:'Çekmece', zh:'抽屉' } },
  LOCKERS_BREACHABLE:   { name: 'Lockers (Breachable)',   locales: { en:'Lockers (Breachable)',   cs:'Vak', de:'Seesack', es:'Bolsa de lona', fr:'Sac marin', hu:'Vászontáska', it:'Borsone', ja:'ダッフルバッグ', ko:'더플백', pl:'Torba wojskowa', pt:'Bolsa de lona', ro:'Geantă de voiaj', ru:'Сумка-баул', sk:'Vak', tr:'Duffel çanta', zh:'旅行袋' } },
  MED_BAG:  { name: 'Med Bag',  locales: { en:'Med Bag',  cs:'Med. vak', de:'Medizintasche', es:'Bolsa médica', fr:'Sac médical', hu:'Orvosi táska', it:'Borsa medica', ja:'医療バッグ', ko:'의료 가방', pl:'Torba medyczna', pt:'Bolsa médica', ro:'Geantă medicală', ru:'Медсумка', sk:'Lekársky vak', tr:'Tıbbi çanta', zh:'医疗包' } },
  ROCKETEER_HUSK:       { name: 'Rocketeer Husk',       locales: { en:'Rocketeer Husk',       cs:'Rocketeer Husk', de:'Rocketeer Husk', es:'Rocketeer Husk', fr:'Rocketeer Husk', hu:'Rocketeer Husk', it:'Rocketeer Husk', ja:'ロケットマンハスク', ko:'로켓맨 허스크', pl:'Rocketeer Husk', pt:'Rocketeer Husk', ro:'Rocketeer Husk', ru:'Rocketeer Husk', sk:'Rocketeer Husk', tr:'Rocketeer Husk', zh:'火箭人哈斯克' } },
  SECURITY_LOCKER:      { name: 'Security Locker',      locales: { en:'Security Locker',      cs:'Bezpečnostní skříňka', de:'Sicherheitsschrank', es:'Taquilla de seguridad', fr:'Coffre-fort', hu:'Biztonsági szekrény', it:'Armadietto di sicurezza', ja:'セキュリティロッカー', ko:'보안 사물함', pl:'Skrzynka bezpieczeństwa', pt:'Armário de segurança', ro:'Dulap de securitate', ru:'Сейф', sk:'Bezpečnostná skriňa', tr:'Güvenlik dolabı', zh:'安全储物柜' } },
  UTILITY_CRATE:      { name: 'Utility Crate',      locales: { en:'Utility Crate',      cs:'Med. bedna', de:'Medizin-Kiste', es:'Caja médica', fr:'Boîte médicale', hu:'Orvosi láda', it:'Cassetta medica', ja:'医療箱', ko:'의료 상자', pl:'Skrzynia medyczna', pt:'Caixa médica', ro:'Cutie medicală', ru:'Медицинский ящик', sk:'Lekárska debna', tr:'Tıbbi kutu', zh:'医疗箱' } },
  WASP_HUSK:         { name: 'Wasp Husk',         locales: { en:'Wasp Husk',         cs:'Trezor', de:'Tresor', es:'Caja fuerte', fr:'Coffre-fort', hu:'Széf', it:'Cassaforte', ja:'金庫', ko:'금고', pl:'Sejf', pt:'Cofre', ro:'Seif', ru:'Сейф', sk:'Trezor', tr:'Kasa', zh:'保险箱' } },
  WEAPON_CASE:      { name: 'Weapon Case',      locales: { en:'Weapon Case',      cs:'Box nářadí', de:'Werkzeugkiste', es:'Caja de herramientas', fr:'Boîte à outils', hu:'Szerszámosláda', it:'Cassetta attrezzi', ja:'工具箱', ko:'공구 상자', pl:'Skrzynka narzędziowa', pt:'Caixa de ferramentas', ro:'Cutie cu unelte', ru:'Ящик с инструментами', sk:'Debna s náradím', tr:'Alet kutusu', zh:'工具箱' } },
}

export const LootChildList = [
  LootConst.VALUABLE,
  LootConst.AMMO_CRATE,
  LootConst.ARC_COURIER,
  LootConst.BARON_HUSK,
  LootConst.CAR,
  LootConst.FIELD_CRATE,
  LootConst.LOCKERS,
  LootConst.LOCKERS_BREACHABLE,
  LootConst.MED_BAG,
  LootConst.ROCKETEER_HUSK,
  LootConst.SECURITY_LOCKER,
  LootConst.UTILITY_CRATE,
  LootConst.WASP_HUSK,
  LootConst.WEAPON_CASE,
]

export const ArcConst = {
  BASTION: { name: 'Bastion', locales: { en:'Bastion', cs:'Sniper Scav', de:'Scharfschützen-Scav', es:'Scav francotirador', fr:'Scav sniper', hu:'Mesterlövész Scav', it:'Scav cecchino', ja:'スナイパースカブ', ko:'저격 스캐브', pl:'Scav snajper', pt:'Scav atirador', ro:'Scav lunetist', ru:'Дикий-снайпер', sk:'Scav ostreľovač', tr:'Keskin nişancı Scav', zh:'狙击Scav' } },
  BOMBARDIER:        { name: 'Bombardier',         locales: { en:'Bombardier',         cs:'Boss', de:'Boss', es:'Jefe', fr:'Boss', hu:'Főnök', it:'Boss', ja:'ボス', ko:'보스', pl:'Boss', pt:'Chefe', ro:'Șef', ru:'Босс', sk:'Boss', tr:'Patron', zh:'首领' } },
  FIREBALL:     { name: 'Fireball',      locales: { en:'Fireball',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  HORNET:     { name: 'Hornet',      locales: { en:'Hornet',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  LEAPER:     { name: 'Leaper',      locales: { en:'Leaper',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  POP:     { name: 'Pop',      locales: { en:'Pop',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  QUEEN:     { name: 'Queen',      locales: { en:'Queen',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  ROCKETEER:     { name: 'Rocketeer',      locales: { en:'Rocketeer',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  SENTINEL:     { name: 'Sentinel',      locales: { en:'Sentinel',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  SNITCH:     { name: 'Snitch',      locales: { en:'Snitch',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  SURVEYOR:     { name: 'Surveyor',      locales: { en:'Surveyor',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  TICK:     { name: 'Tick',      locales: { en:'Tick',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  TURRET:     { name: 'Turret',      locales: { en:'Turret',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
  WASP:     { name: 'Wasp',      locales: { en:'Wasp',      cs:'Kultista', de:'Kultist', es:'Cultista', fr:'Cultiste', hu:'Kultista', it:'Cultista', ja:'カルト信者', ko:'컬티스트', pl:'Kultysta', pt:'Cultista', ro:'Cultist', ru:'Культист', sk:'Kultista', tr:'Tarikatçı', zh:'邪教徒' } },
}

export const ArcChildList = [
  ArcConst.BASTION,
  ArcConst.BOMBARDIER,
  ArcConst.FIREBALL,
  ArcConst.HORNET,
  ArcConst.LEAPER,
  ArcConst.POP,
  ArcConst.QUEEN,
  ArcConst.ROCKETEER,
  ArcConst.SENTINEL,
  ArcConst.SNITCH,
  ArcConst.SURVEYOR,
  ArcConst.TICK,
  ArcConst.TURRET,
  ArcConst.WASP,
]

export const ExtractionConst = {
  EVAC:     { name: 'Evac',     locales: { en:'Evac',     cs:'PMC', de:'PMC', es:'PMC', fr:'PMC', hu:'PMC', it:'PMC', ja:'PMC', ko:'PMC', pl:'PMC', pt:'PMC', ro:'PMC', ru:'ЧВК', sk:'PMC', tr:'PMC', zh:'PMC' } },
  HATCH:    { name: 'Hatch',    locales: { en:'Hatch',    cs:'Kooperace', de:'Koop', es:'Coop', fr:'Coop', hu:'Koop', it:'Co-op', ja:'協力', ko:'협동', pl:'Koop', pt:'Coop', ro:'Coop', ru:'Кооператив', sk:'Koop', tr:'Eşli', zh:'合作' } },
}

export const ExtractionChildList = [
  ExtractionConst.EVAC,
  ExtractionConst.HATCH
]

export const SpawnConst = {
  SPAWN: { name: 'Spawn', locales: { en:'Spawn', cs:'Spawn', de:'Spawn', es:'Aparición', fr:'Apparition', hu:'Spawn', it:'Spawn', ja:'出現', ko:'스폰', pl:'Spawn', pt:'Spawn', ro:'Spawn', ru:'Респаун', sk:'Spawn', tr:'Doğma', zh:'出生' } },
}

export const SpawnChildList = [
  SpawnConst.SPAWN
]

export const QuestsConst = {
  QUESTS: { name: 'Quests', locales: { en:'Quests', cs:'Úkoly', de:'Aufgaben', es:'Misiones', fr:'Quêtes', hu:'Küldetések', it:'Missioni', ja:'クエスト', ko:'퀘스트', pl:'Zadania', pt:'Missões', ro:'Misiuni', ru:'Квесты', sk:'Úlohy', tr:'Görevler', zh:'任务' } },
}

export const QuestsChildList = [
  QuestsConst.QUESTS
]

export const EventConst = {
  HARVESTER: { name: 'Harvester', locales: { en:'Harvester', cs:'Sklizeň', de:'Ernter', es:'Cosechadora', fr:'Moissonneuse', hu:'Betakarító', it:'Raccoglitore', ja:'ハーベスター', ko:'수확기', pl:'Żniwiarz', pt:'Colheitadeira', ro:'Recoltator', ru:'Уборщик', sk:'Zberač', tr:'Hasatçı', zh:'收割机' } },
  LAUNCH_TOWER: { name: 'Launch Tower', locales: { en:'Launch Tower', cs:'Startovací věž', de:'Startturm', es:'Torre de lanzamiento', fr:'Tour de lancement', hu:'Indítótorony', it:'Torre di lancio', ja:'発射塔', ko:'발사대', pl:'Wieża startowa', pt:'Torre de lançamento', ro:'Turn de lansare', ru:'Стартовая башня', sk:'Startovacia veža', tr:'Fırlatma Kulesi', zh:'发射塔' } },
  RAIDER_CACHE: { name: 'Raider Cache', locales: { en:'Raider Cache', cs:'Raider Cache', de:'Raider Cache', es:'Raider Cache', fr:'Raider Cache', hu:'Raider Cache', it:'Raider Cache', ja:'レイダーキャッシュ', ko:'레이다 캐시', pl:'Raider Cache', pt:'Raider Cache', ro:'Raider Cache', ru:'Raider Cache', sk:'Raider Cache', tr:'Raider Cache', zh:'Raider Cache' } },
  WIEKER_BASKET: { name: 'Wieker Basket', locales: { en:'Wieker Basket', cs:'Wieker Basket', de:'Wieker Basket', es:'Wieker Basket', fr:'Wieker Basket', hu:'Wieker Basket', it:'Wieker Basket', ja:'ウィーカーバスケット', ko:'위커 바구니', pl:'Wieker Basket', pt:'Wieker Basket', ro:'Wieker Basket', ru:'Wieker Basket', sk:'Wieker Basket', tr:'Wieker Basket', zh:'Wieker Basket' } },
}

export const EventChildList = [
  EventConst.HARVESTER,
  EventConst.LAUNCH_TOWER,
  EventConst.RAIDER_CACHE,
  EventConst.WIEKER_BASKET,
]

export const NatureConst = {
  AGAVE: { name: 'Agave', locales: { en:'Agave', cs:'Agáve', de:'Agave', es:'Agave', fr:'Agave', hu:'Agave', it:'Agave', ja:'アガベ', ko:'용설란', pl:'Agawa', pt:'Agave', ro:'Agave', ru:'Агава', sk:'Agáve', tr:'Agave', zh:'龙舌兰' } },
  APRICOT: { name: 'Apricot', locales: { en:'Apricot', cs:'Houba', de:'Pilz', es:'Hongo', fr:'Champignon', hu:'Gomba', it:'Fungo', ja:'キノコ', ko:'버섯', pl:'Grzyb', pt:'Cogumelo', ro:'Ciupercă', ru:'Гриб', sk:'Hubka', tr:'Mantar', zh:'蘑菇' } },
  GREAT_MULLEIN: { name: 'Great Mullein', locales: { en:'Great Mullein', cs:'Divizna velkokvětá', de:'Große Königskerze', es:'Verbascum giganteum', fr:'Grande molène', hu:'Nagy ökörfarkkóró', it:'Verbascum giganteum', ja:'オオバコ', ko:'큰왕고들빼기', pl:'Dziewanna wielkokwiatowa', pt:'Verbascum giganteum', ro:'Verbascum giganteum', ru:'Большая коровяк', sk:'Divozel veľkokvetý', tr:'Büyük Mullein', zh:'大蓟' } },
  LEMON: { name: 'Lemon', locales: { en:'Lemon', cs:'Houba', de:'Pilz', es:'Hongo', fr:'Champignon', hu:'Gomba', it:'Fungo', ja:'キノコ', ko:'버섯', pl:'Grzyb', pt:'Cogumelo', ro:'Ciupercă', ru:'Гриб', sk:'Hubka', tr:'Mantar', zh:'蘑菇' } },
  MUSHROOM: { name: 'Mushroom', locales: { en:'Mushroom', cs:'Houba', de:'Pilz', es:'Hongo', fr:'Champignon', hu:'Gomba', it:'Fungo', ja:'キノコ', ko:'버섯', pl:'Grzyb', pt:'Cogumelo', ro:'Ciupercă', ru:'Гриб', sk:'Hubka', tr:'Mantar', zh:'蘑菇' } },
  OLIVE: { name: 'Olive', locales: { en:'Olive', cs:'Houba', de:'Pilz', es:'Hongo', fr:'Champignon', hu:'Gomba', it:'Fungo', ja:'キノコ', ko:'버섯', pl:'Grzyb', pt:'Cogumelo', ro:'Ciupercă', ru:'Гриб', sk:'Hubka', tr:'Mantar', zh:'蘑菇' } },
  PRICKLY_PEAR: { name: 'Prickly Pear', locales: { en:'Prickly Pear', cs:'Houba', de:'Pilz', es:'Hongo', fr:'Champignon', hu:'Gomba', it:'Fungo', ja:'キノコ', ko:'버섯', pl:'Grzyb', pt:'Cogumelo', ro:'Ciupercă', ru:'Гриб', sk:'Hubka', tr:'Mantar', zh:'蘑菇' } },
}

export const NatureChildList = [
  NatureConst.AGAVE,
  NatureConst.APRICOT,
  NatureConst.GREAT_MULLEIN,
  NatureConst.LEMON,
  NatureConst.MUSHROOM,
  NatureConst.OLIVE,
  NatureConst.PRICKLY_PEAR,
]

export const MiscConst = {
  LOCKED_DOOR: { name: 'Locked Door',     locales: { en:'Locked Door',     cs:'Zamčené dveře', de:'Verschlossene Tür', es:'Puerta cerrada', fr:'Porte verrouillée', hu:'Zárt ajtó', it:'Porta chiusa', ja:'施錠ドア', ko:'잠긴 문', pl:'Zamknięte drzwi', pt:'Porta trancada', ro:'Ușă încuiată', ru:'Запертая дверь', sk:'Zamknuté dvere', tr:'Kilitli kapı', zh:'上锁的门' } },
  LEVER:       { name: 'Lever',           locales: { en:'Lever',           cs:'Páka', de:'Hebel', es:'Palanca', fr:'Levier', hu:'Kar', it:'Leva', ja:'レバー', ko:'레버', pl:'Dźwignia', pt:'Alavanca', ro:'Levier', ru:'Рычаг', sk:'Páka', tr:'Kol', zh:'拉杆' } },
  FIELD_DEPOT:     { name: 'Field Depot',         locales: { en:'Field Depot',         cs:'Pole Depo', de:'Felddepot', es:'Depósito de campo', fr:'Dépôt de terrain', hu:'Mezőtároló', it:'Deposito di campo', ja:'フィールドデポ', ko:'필드 창고', pl:'Magazyn polowy', pt:'Depósito de campo', ro:'Depozit de teren', ru:'Полевой склад', sk:'Poľný sklad', tr:'Saha Deposu', zh:'野外仓库' } },
  METRO_ENTRANCE: { name: 'Metro Entrance',     locales: { en:'Metro Entrance',     cs:'Informace', de:'Information', es:'Información', fr:'Information', hu:'Információ', it:'Informazione', ja:'情報', ko:'정보', pl:'Informacja', pt:'Informação', ro:'Informație', ru:'Информация', sk:'Informácia', tr:'Bilgi', zh:'信息' } },
  RAIDER_CAMP:  { name: 'Raider Camp',      locales: { en:'Raider Camp',      cs:'Raider Camp', de:'Raider Camp', es:'Raider Camp', fr:'Raider Camp', hu:'Raider Camp', it:'Raider Camp', ja:'Raider Camp', ko:'Raider Camp', pl:'Raider Camp', pt:'Raider Camp', ro:'Raider Camp', ru:'Raider Camp', sk:'Raider Camp', tr:'Raider Camp', zh:'Raider Camp' } },
  SUPPLY_CALL_STATION:       { name: 'Supply Call Station', locales: { en:'Supply Call Station', cs:'Ruční kolo ventilu', de:'Ventilrad', es:'Volante de válvula', fr:'Volant de vanne', hu:'Szelepkerék', it:'Volantino valvola', ja:'バルブハンドル', ko:'밸브 핸들', pl:'Koło zaworu', pt:'Volante de válvula', ro:'Roată de ventil', ru:'Штурвал клапана', sk:'Ručné koleso ventilu', tr:'Vana kolu', zh:'阀门手轮' } },
}

export const MiscChildList = [
  MiscConst.LOCKED_DOOR,
  MiscConst.LEVER,
  MiscConst.FIELD_DEPOT,
  MiscConst.METRO_ENTRANCE,
  MiscConst.RAIDER_CAMP,
  MiscConst.SUPPLY_CALL_STATION,
]

// ====== Parent Filters (all locales filled) ======
export const FilterConst: FilterDict = {
  CONTAINER:       { name: 'Container',       child: LootChildList,             locales: { en:'Container',       cs:'Kořist', de:'Beute', es:'Botín', fr:'Butin', hu:'Zsákmány', it:'Bottino', ja:'戦利品', ko:'전리품', pl:'Łup', pt:'Saque', ro:'Pradă', ru:'Лут',      sk:'Korisť', tr:'Ganimet', zh:'战利品' } },
  ARC:    { name: 'Arc',    child: ArcChildList,         locales: { en:'Arc',    cs:'Nepřátelé', de:'Feinde', es:'Enemigos', fr:'Ennemis', hu:'Ellenségek', it:'Nemici', ja:'敵', ko:'적', pl:'Wrogowie', pt:'Inimigos', ro:'Inamici', ru:'Враги',    sk:'Nepriatelia', tr:'Düşmanlar', zh:'敌人' } },
  EXTRACTION: { name: 'Extraction', child: ExtractionChildList,       locales: { en:'Extraction', cs:'Exfiltrace', de:'Extraktion', es:'Extracción', fr:'Extraction', hu:'Kivonulás', it:'Estrazione', ja:'脱出', ko:'탈출', pl:'Wyjście', pt:'Extração', ro:'Extragere', ru:'Выходы', sk:'Exfiltrácia', tr:'Çıkış', zh:'撤离' } },
  SPAWN:      { name: 'Spawn',      child: SpawnChildList,            locales: { en:'Spawn',      cs:'Spawn', de:'Spawn', es:'Aparición', fr:'Apparition', hu:'Spawn', it:'Spawn', ja:'出現', ko:'스폰', pl:'Spawn', pt:'Spawn', ro:'Spawn', ru:'Респаун', sk:'Spawn', tr:'Doğma', zh:'出生' } },
  QUESTS:     { name: 'Quests',     child: QuestsChildList,           locales: { en:'Quests',     cs:'Úkoly', de:'Aufgaben', es:'Misiones', fr:'Quêtes', hu:'Küldetések', it:'Missioni', ja:'クエスト', ko:'퀘스트', pl:'Zadania', pt:'Missões', ro:'Misiuni', ru:'Квесты',  sk:'Úlohy', tr:'Görevler', zh:'任务' } },
  EVENT:    { name: 'Event',    child: EventChildList,           locales: { en:'Event', cs:'Obchodníci', de:'Händler', es:'Comerciantes', fr:'Commerçants', hu:'Kereskedők', it:'Commercianti', ja:'トレーダー', ko:'상인', pl:'Handlarze', pt:'Comerciantes', ro:'Comercianți', ru:'Торговцы', sk:'Obchodníci', tr:'Tüccarlar', zh:'商人' } },
  NATURE:    { name: 'Nature',    child: NatureChildList,           locales: { en:'Nature', cs:'Příroda', de:'Natur', es:'Naturaleza', fr:'Nature', hu:'Természet', it:'Natura', ja:'自然', ko:'자연', pl:'Natura', pt:'Natureza', ro:'Natură', ru:'Природа', sk:'Príroda', tr:'Doğa', zh:'自然' } },
  MISC:       { name: 'Misc.',      child: MiscChildList,             locales: { en:'Misc.',      cs:'Různé', de:'Sonstiges', es:'Varios', fr:'Divers', hu:'Egyéb', it:'Varie', ja:'その他', ko:'기타', pl:'Różne', pt:'Diversos', ro:'Diverse', ru:'Разное',  sk:'Rôzne', tr:'Çeşitli', zh:'杂项' } },
  LABEL:      { name: 'Label',      child: MiscChildList,             locales: { en:'Label', cs:'Štítek', de:'Beschriftung', es:'Etiqueta', fr:'Libellé', hu:'Címke', it:'Etichetta', ja:'ラベル', ko:'라벨', pl:'Etykieta', pt:'Rótulo', ro:'Etichetă', ru:'Метка', sk:'Štítok', tr:'Etiket', zh:'标签' } },
} as const;
