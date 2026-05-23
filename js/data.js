/* ===================================================================
   森、道、市場 2026 ガイドアプリ — データ定義
   出典：森、道、市場2026 公式サイト（https://morimichiichiba.jp/）
        ／公式会場マップPDF／公式タイムテーブル画像
   ・タイムテーブルは公式画像をそのまま掲載（正確）。
   ・出店の店名座標は公式マップPDF（1459.84 x 2063.62pt）から抽出し、
     0〜100%の正規化座標に変換。マップ上の店名を直接ハイライトします。
=================================================================== */

const FESTIVAL = {
  name: '森、道、市場 2026',
  nameEn: 'MORI, MICHI, ICHIBA 2026',
  days: [
    { id: 'd1', label: '5/22', dow: 'FRI', date: '2026-05-22', open: '11:00', close: '22:00' },
    { id: 'd2', label: '5/23', dow: 'SAT', date: '2026-05-23', open: '10:00', close: '22:00' },
    { id: 'd3', label: '5/24', dow: 'SUN', date: '2026-05-24', open: '10:00', close: '20:00' }
  ],
  venue: 'ラグーナビーチ（大塚海浜緑地）／ラグナシア',
  address: '〒443-0014 愛知県蒲郡市海陽町2丁目39番',
  official: 'https://morimichiichiba.jp/',
  links: {
    timetable: 'https://morimichiichiba.jp/timetable/',
    market: 'https://morimichiichiba.jp/market/',
    artist: 'https://morimichiichiba.jp/artist/',
    ticket: 'https://morimichiichiba.jp/ticket/',
    news: 'https://morimichiichiba.jp/news/',
    access: 'https://morimichiichiba.jp/access/',
    map: 'https://morimichiichiba.jp/map/'
  },
  weather: 'https://tenki.jp/forecast/5/26/5120/23214/',
  access: [
    { icon: '🚌', title: 'JR蒲郡駅 有料シャトルバス',
      detail: '5/22は10:00〜18:00、5/23・24は8:30〜18:00運行。復路は最終22:00頃（5/24は21:00頃）。所要約20分。',
      fare: '大人500円・小児250円' },
    { icon: '🚶', title: 'JR三河大塚駅から徒歩',
      detail: '徒歩約25分。三河大塚駅からのシャトルバスはありません。', fare: '—' },
    { icon: '🚗', title: '車でのアクセス',
      detail: '名古屋・岡崎方面からは音羽蒲郡ICで降り国道1号を利用。駐車場はC・F・Gほか。国道73号・247号・23号は渋滞予測のため迂回推奨。',
      fare: '駐車券は事前購入制' }
  ]
};

const INFO = {
  emergency: [
    { icon: '🏥', title: '救護所', text: '会場内に救護所を複数設置。体調不良時はスタッフまたは最寄りの救護所へ。' },
    { icon: '🚻', title: 'トイレ', text: '各エリアに仮設トイレ・多目的トイレを設置。マップのトイレ表記を参照。' },
    { icon: '🧒', title: '迷子・落とし物', text: 'インフォメーションセンター（各ゲート付近）で対応。' },
    { icon: '💧', title: '給水所', text: 'ウォーターステーションでマイボトルへの給水が可能。' },
    { icon: '🔌', title: '授乳・離乳食', text: '離乳食用のお湯は遊園地入口のインフォメーションで受け取れます。' },
    { icon: '📵', title: '撮影ルール', text: 'ステージ撮影は携帯電話の手持ち撮影のみ。撮影禁止アーティストに注意。' }
  ],
  rules: [
    'リストバンドは常時着用。再入場時に必要です。',
    'ビン・缶の持ち込みは不可。ペットボトルは可。',
    'ゴミは分別の上、ゴミステーションへ。コンポストステーションも設置。',
    'キャンプは指定区画のみ。直火は禁止です。'
  ],
  faq: [
    { q: '再入場はできますか？', a: 'リストバンドを着用していれば再入場口から再入場できます。マップに再入場口の表記があります。' },
    { q: '雨でも開催しますか？', a: '雨天決行・荒天中止。荒天時は内容変更の可能性があり、最新情報は公式SNSで告知されます。' },
    { q: '支払いは現金が必要ですか？', a: '出店により異なります。現金とキャッシュレスの両方を用意しておくのが安心です。' },
    { q: '子ども連れでも楽しめますか？', a: '遊園地エリアやファミリー向けの催しがあり、離乳食用のお湯の提供もあります。' },
    { q: 'ペットの同伴は可能ですか？', a: '指定のルールがあるため、公式サイトの最新案内を必ず確認してください。' }
  ],
  checklist: [
    'チケット／QRコード', 'モバイルバッテリー', '日焼け止め・帽子',
    'レインウェア（雨具）', 'マイボトル・タオル', '小銭・現金',
    '歩きやすい靴', '羽織りもの（夜は冷える）', 'ウェットティッシュ', 'ゴミ袋'
  ]
};

/* 会場マップ画像（公式PDFをPNG化） */
const MAP = { img: 'img/mm2026_full.webp' };

/* 公式タイムテーブル画像（日別） */
/* 公式タイムテーブル画像。w/h は実寸（縦横比をレイアウト前に確定し
   読み込み時のガタつき＝レイアウトシフトを防ぐ）。 */
const TIMETABLE = {
  d1: { src: 'img/tt_d1.jpg', w: 1438, h: 1460 },
  d2: { src: 'img/tt_d2.jpg', w: 1346, h: 1436 },
  d3: { src: 'img/tt_d3.jpg', w: 1526, h: 1448 }
};

/* マップ上のエリアピン（ステージ・入口・主要エリア）
   座標は公式マップPDFから抽出した正規化値（%） */
const ZONES = [
  { id: 'west-gate',  name: 'WEST ENTRANCE GATE', type: 'gate',  x: 9,  y: 29 },
  { id: 'east-gate',  name: 'EAST ENTRANCE GATE', type: 'gate',  x: 90, y: 33 },
  { id: 'art-stage',  name: 'MORI MICHI ART THEATER', type: 'stage', x: 13, y: 17 },
  { id: 'park-stage', name: '遊園地STAGE',        type: 'stage', x: 44, y: 28 },
  { id: 'disco-stage',name: 'MORI MICHI DISCO STAGE', type: 'stage', x: 82, y: 38 },
  { id: 'grass-stage',name: 'GRASS STAGE',        type: 'stage', x: 65, y: 66 },
  { id: 'sand-stage', name: 'SAND STAGE',         type: 'stage', x: 80, y: 69 },
  { id: 'hill-stage', name: 'HILL STAGE',         type: 'stage', x: 17, y: 79 },
  { id: 'eikyo-stage',name: '影響亜細亜STAGE',     type: 'stage', x: 47, y: 61 },
  { id: 'eatbeat',    name: 'EATBEAT! STAGE',     type: 'stage', x: 42, y: 75 },
  { id: 'eatbeat-ichi', name: 'EATBEAT!10（出店）', type: 'area', x: 40, y: 72 },
  { id: 'liverary', name: 'LIVERARY pre. エリア', type: 'area', x: 7, y: 23 },
  { id: 'tane',     name: '種と旅と', type: 'area', x: 25, y: 10 },
  { id: 'yuenchi-market', name: 'SPLASH MARKET', type: 'area', x: 54, y: 6 },
  { id: 'yuenchi-market2', name: '遊園地MARKET', type: 'area', x: 64, y: 5 },
  { id: 'morimichi-disco', name: '森道食堂 DISCO支店', type: 'area', x: 50, y: 13 },
  { id: 'morimichi-umi', name: '森道食堂 海支店', type: 'area', x: 83, y: 63 },
  { id: 'kaigan6',  name: '海岸通り六丁目', type: 'area', x: 31, y: 93 },
  { id: 'river-market', name: 'RIVER MARKET', type: 'area', x: 14, y: 50 },
  { id: 'kyoryu',     name: 'KYORYU STREET',  type: 'area', x: 17, y: 53 },
  { id: 'play-market',name: 'PLAY MARKET',    type: 'area', x: 80, y: 43 },
  { id: 'little-okinawa', name: 'リトルオキナワ', type: 'area', x: 66, y: 54 },
  { id: 'fantastic', name: 'ファンタスティックマーケット', type: 'area', x: 90, y: 57 },
  { id: 'east-caravan', name: 'EAST CARAVAN', type: 'area', x: 77, y: 73 },
  { id: 'venture',   name: 'VENTURE ONWARD by Purveyors', type: 'area', x: 13, y: 70 },
  { id: 'ukiuki',    name: 'ウキウキ通り', type: 'area', x: 19, y: 83 },
  { id: 'kaigan1',   name: '海岸通り一丁目', type: 'area', x: 31, y: 76 },
  { id: 'kaigan2',   name: '海岸通り二丁目', type: 'area', x: 31, y: 82 },
  { id: 'kaigan3',   name: '海岸通り三丁目', type: 'area', x: 52, y: 78 },
  { id: 'kaigan4',   name: '海岸通り四丁目', type: 'area', x: 64, y: 80 },
  { id: 'kaigan5',   name: '海岸通り五丁目', type: 'area', x: 42, y: 89 },
  { id: 'center-gai',name: '森道センター街',  type: 'area', x: 59, y: 86 },
  { id: 'nagano',    name: 'ながのなの',     type: 'area', x: 77, y: 87 },
  { id: 'shibafu',   name: '森道芝生広場・新京都会館', type: 'area', x: 90, y: 81 },
  { id: 'nonnon',    name: 'のんのんパレード', type: 'area', x: 40, y: 95 },
  /* 公式エリア。会場マップPDF上の位置が未取得のため座標なし（マップピン非表示）。 */
  { id: 'shimanami', name: 'しまなみやまなみバイブス県', type: 'area', x: null, y: null }
];

/* 出演アーティスト（公式アーティストページ掲載順）
   days … 出演日（公式 artist_day01/02/03 と照合）。d1=5/22(金)・d2=5/23(土)・d3=5/24(日)。
   ※出演時刻・ステージはタイムテーブル画像で確認 */
const ARTIST_DATA = [
  { name: '∈Y∋', days: ['d1'] },
  { name: 'Aisho Nakajima', days: ['d3'], aliases: ['アイショウナカジマ','中島愛笑'] },
  { name: 'adieu', days: ['d2'], aliases: ['アデュー'] },
  { name: 'abentis', days: ['d2'] },
  { name: 'ecec', days: ['d3'] },
  { name: 'iga', days: ['d2'] },
  { name: '石野卓球', days: ['d1'] },
  { name: 'VMO a.k.a Violent Magic Orchestra', days: ['d2'] },
  { name: 'vq', days: ['d3'] },
  { name: 'West Ape', days: ['d3'] },
  { name: 'N²', days: ['d3'] },
  { name: 'FCO.', days: ['d3'] },
  { name: 'Elle', days: ['d2'] },
  { name: '大友良英', days: ['d1'] },
  { name: '岡村靖幸', days: ['d1'] },
  { name: 'オカモトレイジ(OKAMOTO\'S)', days: ['d3'] },
  { name: '掟ポルシェ', days: ['d1'] },
  { name: 'OddRe:', days: ['d3'] },
  { name: '思い出野郎Aチーム', days: ['d3'] },
  { name: '角銅真実', days: ['d1'] },
  { name: '片岡メリヤス × 井手健介', days: ['d1'] },
  { name: 'カネコアヤノ＋本村拓磨', days: ['d1'] },
  { name: 'Kamui', days: ['d2'], aliases: ['カムイ'] },
  { name: 'Galileo Galilei', days: ['d3'], aliases: ['ガリレオガリレイ','ガリレオ ガリレイ'] },
  { name: 'かわにしなつき', days: ['d2'] },
  { name: '川辺素(BAND SET)', days: ['d1'] },
  { name: '川村亘平斎と岬の魔女たち', days: ['d1'] },
  { name: 'キタニタツヤ', days: ['d3'] },
  { name: '君島大空(独奏)', days: ['d1'] },
  { name: '奇妙礼太郎', days: ['d1', 'd3'] },
  { name: '木村カエラ', days: ['d2'] },
  { name: 'きゃりーぱみゅぱみゅ', days: ['d3'] },
  { name: 'KIRINJI', days: ['d2'], aliases: ['キリンジ'] },
  { name: '草刈愛美', days: ['d2'] },
  { name: 'kurayamisaka', days: ['d2'] },
  { name: 'Kroi', days: ['d1'], aliases: ['クロイ'] },
  { name: 'GUNSOKAI 郡囃会', days: ['d2'] },
  { name: 'ケケノコ族', days: ['d2'] },
  { name: 'コロコロチキチキペッパーズ ナダル', days: ['d2'] },
  { name: '坂田律子', days: ['d3'] },
  { name: '坂本美雨 With 伊藤ゴロー', days: ['d1'] },
  { name: 'the cabs', days: ['d2'] },
  { name: 'さとうもか(Trio set)', days: ['d3'] },
  { name: '佐野元春 & THE COYOTE BAND', days: ['d2'] },
  { name: 'the bercedes menz', days: ['d1'] },
  { name: 'SAMO', days: ['d2'] },
  { name: 'さらさ(Duo Set)', days: ['d1'] },
  { name: 'Shhhhh', days: ['d2'] },
  { name: 'SEEDA', days: ['d2'], aliases: ['シーダ'] },
  { name: 'Siero', days: ['d2'] },
  { name: '6EYES', days: ['d1'] },
  { name: '柴田聡子(BAND SET)', days: ['d3'] },
  { name: 'シャッポ', days: ['d3'] },
  { name: 'JUN INAGAWA', days: ['d3'] },
  { name: 'Shoma fr,dambosound', days: ['d3'] },
  { name: 'Ginger Root(Solo Set)', days: ['d1'], aliases: ['ジンジャールート','ジンジャー ルート'] },
  { name: '神聖かまってちゃん', days: ['d2'] },
  { name: 'Jinmenusagi', days: ['d3'], aliases: ['ジンメンウサギ','人面うさぎ'] },
  { name: '砂原良徳', days: ['d2'] },
  { name: 'SPECIAL OTHERS', days: ['d2'], aliases: ['スペシャルアザーズ','スペシャル アザーズ','スペアザ'] },
  { name: 'Daoko', days: ['d1'], aliases: ['ダヲコ','ダオコ'] },
  { name: 'D.A.N.', days: ['d1'], aliases: ['ディーエーエヌ','ダン'] },
  { name: '珍盤亭娯楽師匠', days: ['d2'] },
  { name: 'discordsquad2k', days: ['d2'] },
  { name: 'Texas 3000', days: ['d2'] },
  { name: 'TETORA', days: ['d3'], aliases: ['テトラ'] },
  { name: 'トップシークレットマン', days: ['d2'] },
  { name: 'とろサーモン久保田', days: ['d3'] },
  { name: '長瀬有花', days: ['d3'] },
  { name: 'nutsman', days: ['d1'] },
  { name: '二階堂和美', days: ['d1'] },
  { name: 'NISENNENMONDAI', days: ['d2'], aliases: ['ニセンネンモンダイ','二千年問題'] },
  { name: 'never young beach', days: ['d3'], aliases: ['ネバーヤングビーチ','ネバヤン'] },
  { name: '野村友里(eatrip)', days: ['d1'] },
  { name: '蓮沼執太フィル', days: ['d3'] },
  { name: 'Hump Back', days: ['d3'], aliases: ['ハンプバック','ハンプ バック'] },
  { name: 'Peterparker69', days: ['d3'], aliases: ['ピーターパーカー','ピーターパーカー69'] },
  { name: 'ピーナッツくん', days: ['d1'] },
  { name: 'BBBBBBB', days: ['d1'] },
  { name: 'ヒカシュー', days: ['d3'] },
  { name: 'BYORA', days: ['d3'] },
  { name: 'Billyrrom', days: ['d3'], aliases: ['ビリーロム','ビリーロム'] },
  { name: '5Windows Freak (DJ SET)', days: ['d3'] },
  { name: '5 Star Cowboy', days: ['d2'] },
  { name: 'FELINE', days: ['d3'] },
  { name: 'ブランデー戦記', days: ['d2'] },
  { name: 'BREIMEN', days: ['d2'], aliases: ['ブレイメン'] },
  { name: 'Frog 3', days: ['d3'] },
  { name: 'Bonbero', days: ['d3'], aliases: ['ボンベロ'] },
  { name: 'Mom', days: ['d3'], aliases: ['マム','モム'] },
  { name: 'marucoporoporo', days: ['d3'] },
  { name: '向井秀徳アコースティック＆エレクトリック', days: ['d1'] },
  { name: 'MONO NO AWARE', days: ['d2'], aliases: ['モノノアワレ','モノ ノ アワレ','物の哀れ'] },
  { name: 'YAGI YOYO TEAM', days: ['d3'] },
  { name: 'やけのはら', days: ['d1'] },
  { name: '柳瀬白瀬(from betcover!!)', days: ['d2'] },
  { name: 'Yog*', days: ['d2'] },
  { name: 'yonige', days: ['d2'], aliases: ['ヨニゲ','よにげ'] },
  { name: 'ヨネダ2000', days: ['d2'] },
  { name: 'Lucky Kilimanjaro', days: ['d1'], aliases: ['ラッキーキリマンジャロ','ラッキー キリマンジャロ','ラキキリ'] },
  { name: 'ランジャタイ', days: ['d3'] },
  { name: 'lilbesh ramko', days: ['d3'] },
  { name: 'rui', days: ['d3'] },
  { name: 'レテ', days: ['d2'] },
  { name: 'ROBBIN(L.O.S.T)', days: ['d3'] },
  { name: 'Worldwide Skippa', days: ['d2'] },
  { name: 'Watson', days: ['d2'], aliases: ['ワトソン'] },
  /* 以下は公式照合で判明した追加分（既存IDを崩さないため末尾に追加） */
  { name: 'Tade Dust', days: ['d3'] },
  { name: '奇妙礼太郎BAND', days: ['d3'] }
];

/* 出店ショップ（公式マップPDF「出店一覧」掲載の全店・約420店）
   形式: [店名, カテゴリ, エリアID, 店名X%, 店名Y%, 幅%, 高さ%, ブース番号, 出店日(任意), 別名(任意)]
   座標なし（追加店）形式: [店名, カテゴリ, エリアID]
   別名（aliases）… 検索で英⇄カナ相互ヒットさせるためのカタカナ表記等。
     例：["ミナペルホネン","ミナ ペルホネン"]。任意。
   座標なし＋日別: [店名, カテゴリ, エリアID, 出店日, 共有ブース番号(任意)]
   店名は公式サイトの出店一覧と照合。X/Y/幅/高さ＝公式マップPDFの
   「出店一覧」内の店名テキスト位置（正規化）。マップ上でこの店名を直接ハイライト。
   ブース番号＝マーケット内の通し番号（会場マップの同番号ブースが目印）。
   出店日 … d1=5/22(金) / d2=5/23(土) / d3=5/24(日)。
   未指定（または空配列）は全日出店扱い。 */
const SHOP_DATA = [
  ["NORMAL","goods","liverary",1.53,3.14,3.87,0.57,1],
  ["ZEZE","goods","liverary",1.53,3.67,5.44,0.57,2,["d2","d3"]],
  ["CHOWCHOW","goods","liverary",1.53,4.21,11.66,0.57,3],
  ["City Dining Macy's","food","liverary",1.53,4.74,6.57,0.57,4],
  ["カロリー軒","goods","liverary",1.53,5.27,5.92,0.57,5,["d1"]],
  ["ひねもすのたりとsunday wine clab","drink","liverary",1.53,6.34,10.23,0.57,6],
  ["TRESOL","goods","liverary",1.53,6.87,3.7,0.57,7,null,["トレゾル","トレソル"]],
  ["A.N.D.","goods","liverary",1.53,7.41,3.08,0.57,8],
  ["スパイスアワー","goods","liverary",1.53,7.94,4.95,0.57,9],
  ["カレーショップ らんびー","food","liverary",1.53,8.47,7.22,0.57,10],
  ["Bar kanata","goods","liverary",1.53,9.0,4.29,0.57,11],
  ["スパイスカレーと無国籍料理 maai (間合い)","food","liverary",1.53,9.54,5.46,0.57,12],
  ["JIRRI.","goods","liverary",1.53,11.67,2.9,0.57,14],
  ["シヤチル","goods","liverary",1.53,12.2,3.37,0.57,15],
  ["CoffeeSupreme","drink","liverary",1.53,12.74,5.77,0.57,16,null,["コーヒースプリーム","コーヒー シュプリーム"]],
  ["ブロッケン","goods","liverary",1.53,13.27,3.88,0.57,17],
  ["炊々","goods","liverary",1.53,13.8,4.93,0.57,18,["d2","d3"]],
  ["幸福館","goods","liverary",1.53,14.34,5.54,0.57,19,["d2","d3"]],
  ["ネグラ(妄想インドカレーと越境庶民料理店)","food","liverary",1.53,14.87,7.9,0.57,20],
  ["OFF","goods","liverary",1.53,15.36,14.61,1.44,21],
  ["チーム銘々","goods","liverary",1.53,16.47,3.99,0.57,22],
  ["OPERE","goods","liverary",1.53,17.0,3.35,0.57,23],
  ["kuretal百貨センター","goods","liverary",1.53,17.53,6.4,0.57,24],
  ["鋤田収集事務所","goods","liverary",1.53,18.07,5.22,0.57,25],
  ["延命ランド","goods","liverary",1.53,18.6,3.91,0.57,26],
  ["KIOSCO","goods","liverary",1.53,19.13,3.67,0.57,27],
  ["JYUKU","goods","liverary",1.53,19.67,3.32,0.57,28],
  ["NOTHING","goods","liverary",1.53,20.18,10.36,0.59,29,["d2","d3"]],
  ["Moloch","goods","liverary",1.53,20.73,5.97,0.57,30,["d2","d3"]],
  ["にしこはりこ","goods","liverary",1.53,21.26,6.67,0.57,31,["d1","d2"]],
  ["SUEKKO","goods","liverary",1.53,21.8,3.83,0.57,32,["d2","d3"]],
  ["LIONS©","goods","liverary",1.53,21.8,3.83,0.57,32,["d1","d2"]],
  ["namo. × merry yarn","goods","liverary",1.53,22.86,3.76,0.57,33],
  ["チェルプ","goods","liverary",1.53,23.93,3.38,0.57,34],
  ["スペースたのしい","goods","liverary",1.53,32.46,5.46,0.57,35],
  ["Diorama & Panorama","goods","liverary",1.53,32.99,6.96,0.57,36],
  ["RELAX ORIGINAL®","goods","liverary",1.53,33.52,6.96,0.57,37],
  ["MAD BOXXX","goods","liverary",1.53,34.06,4.95,0.57,38],
  ["Cane Cane","goods","liverary",1.53,34.59,4.38,0.57,39,null,["ケーンケーン","カネカネ"]],
  ["YUICHIRO TAMAKI","goods","liverary",1.53,35.12,6.79,0.57,40],
  ["BOY","goods","liverary",1.53,35.66,2.49,0.57,41],
  ["YAMASTORE","goods","liverary",1.53,36.19,5.08,0.57,42,null,["ヤマストア","ヤマストアー"]],
  ["AWA by ukuuproject","goods","liverary",1.53,36.72,7.1,0.57,43],
  ["JIAJIA","goods","liverary",1.53,37.26,3.18,0.57,44],
  ["MATO OBJECTS STORE","goods","liverary",1.53,37.79,8.4,0.57,45],
  ["KAN","goods","liverary",1.53,38.32,2.27,0.57,46],
  ["CAN BUY RECORDS","art","liverary",1.53,38.86,7.19,0.57,47,null,["キャンバイレコード","キャンバイレコーズ"]],
  ["NU TRIAH","goods","liverary",1.53,39.39,4.22,0.57,48],
  ["DELI","food","liverary",1.53,39.92,2.65,0.57,49],
  ["rim","goods","liverary",1.53,40.45,2.16,0.57,50],
  ["新町ビル（山の花/地想）","goods","liverary",1.53,40.99,7.83,0.57,51],
  ["インターチェンジ by Good Broken Charm","goods","liverary",1.53,41.52,14.93,0.57,52,["d2","d3"]],
  ["MAKEDOO by Hiraparr","goods","liverary",1.53,42.05,7.84,0.57,53],
  ["CHA CHA CHA BOOKS & CAFE","drink","liverary",1.53,42.59,10.48,0.57,54],
  ["LIVERARY Extra","goods","liverary",1.53,43.12,6.04,0.57,55],
  ["大橋裕之の似顔絵屋","art","liverary",1.53,43.65,6.36,0.57,56],
  ["JAMとスロメ","goods","liverary",1.53,44.19,4.62,0.57,57],
  ["MOLE FACTORY","goods","liverary",1.53,44.72,6.1,0.57,58],
  ["sheep","goods","river-market",1.52,47.48,2.94,0.57,1],
  ["山のふもと","goods","river-market",1.52,48.01,3.97,0.57,2],
  ["島と山　nice things.&ACTIBASE","sweets","river-market",1.52,48.55,10.25,0.57,3],
  ["kenta chujo","goods","river-market",1.52,49.08,4.82,0.57,4],
  ["NAOKO HATA CERAMICS","goods","river-market",1.52,49.61,8.79,0.57,5],
  ["sAn","goods","river-market",1.52,50.14,2.36,0.57,6],
  ["chappo","goods","river-market",1.52,50.68,3.47,0.57,7],
  ["MAZURKA","goods","river-market",1.52,51.21,4.38,0.57,8],
  ["abundantism＋岡崎ぎゃざ","goods","river-market",1.52,51.74,8.04,0.57,9],
  ["The Goggo(ザ ゴゴー)","goods","river-market",1.52,52.28,7.34,0.57,10],
  ["quark+grenier","goods","river-market",1.52,52.81,5.2,0.57,11],
  ["アポロコーヒーワークス","drink","river-market",1.52,53.34,7.02,0.57,12],
  ["hankachi/beauty","goods","river-market",1.52,53.88,8.58,0.57,13,["d2","d3"]],
  ["大澤哲哉/HIKARI MASUDA","goods","river-market",1.52,54.41,11.74,0.57,14,["d2","d3"]],
  ["BAKERY dry river","food","river-market",1.52,54.94,6.29,0.57,15,null,["ベーカリードライリバー","ドライリバー"]],
  ["小菅くみ＋そで山かほ子","goods","river-market",1.52,55.48,6.99,0.57,16],
  ["ペットの絵描きます　金森青葉","goods","river-market",1.52,56.01,8.8,0.57,17],
  ["世界文庫 / 世界文庫アカデミー","art","river-market",1.52,56.54,9.0,0.57,18],
  ["きびす堂","goods","river-market",1.52,57.07,3.41,0.57,19],
  ["Instars","goods","river-market",1.52,57.61,3.17,0.57,20],
  ["ituka","goods","river-market",1.52,58.14,2.64,0.57,21],
  ["米粉sweets kinun.","sweets","river-market",1.52,58.67,8.85,0.57,22,["d2","d3"]],
  ["チーズケーキ tenton-テントン-","sweets","river-market",1.52,59.21,11.42,0.57,23,["d2","d3"]],
  ["tope.information","goods","river-market",1.52,59.74,5.95,0.57,24],
  ["GRAPH.","goods","river-market",1.52,60.27,3.61,0.57,25],
  ["CAFE SNUG","drink","river-market",1.52,60.81,4.87,0.57,26],
  ["雑貨屋 孵","goods","river-market",1.52,61.34,3.74,0.57,27],
  ["凸凹ことのは舎","goods","river-market",1.52,61.87,5.03,0.57,28],
  ["四匹","goods","river-market",1.52,62.4,2.4,0.57,29],
  ["September Poetry","goods","river-market",1.52,62.94,6.42,0.57,30],
  ["鈴木 友紀","goods","river-market",1.52,63.47,3.74,0.57,31],
  ["YOHEI NOGUCHI","goods","river-market",1.52,64.0,6.23,0.57,32],
  ["松本 寛司","goods","river-market",1.52,64.54,3.72,0.57,33],
  ["平野日奈子","goods","river-market",1.52,65.07,4.04,0.57,34],
  ["ヤマネギターズ","goods","river-market",1.52,65.6,4.94,0.57,35],
  ["茨木　伸恵","goods","river-market",1.52,66.14,3.73,0.57,36],
  ["FARCRY BREWINGとNUMB&HAZY","drink","venture",1.53,71.09,11.22,0.57,1],
  ["EYL","goods","venture",1.53,71.62,2.46,0.57,2,["d2","d3"]],
  ["AlexanderLeeChang","goods","venture",1.53,73.76,7.04,0.57,3],
  ["Lue","goods","venture",1.53,75.36,2.33,0.57,4],
  ["OLDMOUNTAIN","goods","venture",1.53,77.49,6.06,0.57,5],
  ["haccoba Craft Sake Brewery","drink","venture",1.53,78.02,9.49,0.57,6],
  ["移動帽子屋AURA","goods","venture",1.53,80.69,5.83,0.57,7],
  ["atelier dehors","art","venture",1.53,81.22,5.21,0.57,8],
  ["DUCKROW DEPART","goods","venture",1.53,81.75,7.16,0.57,9],
  ["&NUT","goods","venture",1.53,82.28,2.92,0.57,10],
  ["HAIDA","goods","venture",1.53,82.82,3.14,0.57,11],
  ["honopottery","art","venture",1.53,83.35,4.71,0.57,12],
  ["H.A.K.U MOUNTAIN SUPPLY","goods","venture",1.53,83.88,9.59,0.57,13],
  ["YOKA×ONEPOTWONDER","goods","venture",1.53,84.42,9.19,0.57,14],
  ["2-3-4SHOKUDO","goods","venture",1.53,84.95,5.82,0.57,15],
  ["neru design works","goods","venture",1.53,85.48,6.42,0.57,16],
  ["halo commodity","goods","venture",1.53,86.02,5.81,0.57,17,null,["ハロコモディティ","ハロー コモディティ"]],
  ["DVERG","goods","venture",1.53,86.55,3.34,0.57,18],
  ["Ashitabi","goods","venture",1.53,87.08,3.54,0.57,19],
  ["caya","goods","venture",1.53,87.62,2.58,0.57,20],
  ["mameritsuko","goods","venture",1.53,88.15,4.91,0.57,21],
  ["fons","goods","venture",1.53,88.68,2.48,0.57,22],
  ["中囿　義光","goods","venture",1.53,89.21,3.73,0.57,23],
  ["ttoo","goods","venture",1.53,89.75,2.42,0.57,24],
  ["MANIKA","goods","venture",1.53,90.28,3.72,0.57,25],
  ["Sipilica","goods","venture",1.53,90.81,3.36,0.57,26,null,["シピリカ"]],
  ["rig footwear","goods","venture",1.53,91.35,4.73,0.57,27],
  ["100mermaids and 100beasts","goods","venture",1.53,91.88,9.27,0.57,28],
  ["stability","goods","venture",1.53,92.41,3.62,0.57,29],
  ["神山隆二","goods","venture",1.53,92.95,3.53,0.57,30],
  ["tempra garage & Marquez Shop","goods","venture",1.53,93.48,10.21,0.57,31],
  ["HALFTRACK PRODUCTS","goods","venture",1.53,94.01,8.65,0.57,32],
  ["NEVER WASTED/handson grip","goods","venture",1.53,94.54,10.1,0.57,33],
  ["わたし、ローチョコレート","sweets","venture",1.53,95.08,7.31,0.57,34],
  ["サンキューバナナ","goods","venture",1.53,95.61,5.45,0.57,35],
  ["味噌湯 志なだ","goods","venture",1.53,96.14,4.8,0.57,36],
  ["発酵惑星","goods","venture",1.53,96.68,3.53,0.57,37],
  ["Paddy Field General Store","goods","kyoryu",13.39,48.15,4.62,0.57,1],
  ["PEEPLE","goods","kyoryu",13.39,49.21,3.66,0.57,2],
  ["yup","goods","kyoryu",13.39,49.75,2.29,0.57,3],
  ["DECHO / NAPRON","goods","kyoryu",13.39,50.28,3.98,0.57,4],
  ["光郷城 畑懐","goods","tane",16.2,2.45,4.7,0.57,1],
  ["野母崎樺島製塩所","goods","tane",16.2,2.98,5.81,0.57,2],
  ["minä perhonen","goods","tane",16.2,3.51,5.49,0.57,3,null,["ミナペルホネン","ミナ ペルホネン","ミナ・ペルホネン","ミナペル","mina perhonen"]],
  ["igora","goods","tane",16.2,4.05,13.14,0.57,4],
  ["Wine Bar Alpes","drink","tane",16.2,5.64,5.68,0.57,5,null,["ワインバーアルプス","ワイン バー アルプス"]],
  ["久米桜三輪智成","goods","tane",16.2,7.24,5.42,0.57,6],
  ["Burger Mania","food","ukiuki",16.64,83.85,5.07,0.57,1,null,["バーガーマニア"]],
  ["スープカレーよつば","food","ukiuki",16.64,84.38,5.98,0.57,2],
  ["繁邦","goods","ukiuki",16.64,84.92,2.42,0.57,3],
  ["VAAT","goods","ukiuki",16.64,85.45,4.92,0.57,4,["d1"]],
  ["tak beans","goods","ukiuki",16.64,86.52,4.03,0.57,5],
  ["餃子スラッピー","food","ukiuki",16.64,87.05,4.92,0.57,6],
  ["MILK TEA SERVICE","drink","ukiuki",16.64,87.58,7.08,0.57,7],
  ["ラーメンやんぐ","food","ukiuki",16.64,88.11,4.89,0.57,8],
  ["かかん","goods","ukiuki",16.64,88.65,2.9,0.57,9],
  ["NEWROSE","goods","ukiuki",16.64,89.18,4.34,0.57,10],
  ["POMPONCAKES","sweets","ukiuki",16.64,89.71,6.05,0.57,11,null,["ポンポンケーキ","ポンポンケークス"]],
  ["TSOL inc","goods","ukiuki",16.64,90.25,3.93,0.57,12],
  ["KIKI NATURAL ICECREAM","sweets","ukiuki",16.64,90.78,9.0,0.57,13,null,["キキナチュラルアイスクリーム","キキ アイス"]],
  ["青果ミコト屋","goods","ukiuki",16.64,91.31,4.35,0.57,14],
  ["Tiny N","goods","ukiuki",16.64,91.85,3.1,0.57,15],
  ["fragrance yes","goods","ukiuki",16.64,92.38,5.1,0.57,16],
  ["WUY","goods","ukiuki",16.64,92.91,2.64,0.57,17],
  ["八方美米・八方美菜","goods","ukiuki",16.64,93.45,8.68,0.57,18,["d1","d2"]],
  ["TANUKI APPETIZING","goods","ukiuki",16.64,94.51,9.46,0.57,19,["d1"]],
  ["Blanc a tokyo","goods","ukiuki",16.64,95.58,7.81,0.57,20,["d1","d2"]],
  ["山角や","goods","ukiuki",16.64,96.64,2.93,0.57,21],
  ["KIKI WINE CLUB","drink","ukiuki",16.64,97.18,6.15,0.57,22],
  ["石窯PIZZA屋台boccheno","food","kaigan1",27.84,77.04,8.19,0.57,1],
  ["ぞうめし屋","goods","kaigan1",27.84,77.57,3.91,0.57,2],
  ["Going Cafe","drink","kaigan1",27.84,78.11,4.5,0.57,3,null,["ゴーイングカフェ","ゴーイング カフェ"]],
  ["K's Pit","goods","kaigan1",27.84,78.64,3.15,0.57,4],
  ["AOW","goods","kaigan1",27.84,79.17,2.74,0.57,5],
  ["コジゴロ","goods","kaigan1",27.84,79.71,3.4,0.57,6],
  ["KANNON＿PLUS","goods","kaigan1",27.84,80.24,6.21,0.57,7],
  ["PAPERSKY STORE","goods","kaigan2",27.84,83.14,6.86,0.57,1],
  ["サークルズ / サイクルクローク","goods","kaigan2",27.84,83.67,8.77,0.57,2],
  ["CHAORAS（チャオラス）","goods","kaigan2",27.84,84.2,7.79,0.57,3],
  ["one nova","goods","kaigan2",27.84,84.73,3.87,0.57,4],
  ["サークルズ/PFM/CERCH","goods","kaigan2",27.84,85.27,8.5,0.57,5],
  ["かかし","goods","kaigan2",27.84,85.8,2.9,0.57,6],
  ["TUMBLEWEED","goods","kaigan2",27.84,86.33,5.64,0.57,7,null,["タンブルウィード"]],
  ["POT EQUIPMENT STORE","goods","kaigan2",27.84,86.87,8.69,0.57,8],
  ["TACOMA FUJI RECORDS","food","kaigan2",27.84,87.93,8.63,0.57,9,null,["タコマフジレコーズ","タコマフジレコード","タコマフジ"]],
  ["バーリカーズ","drink","kaigan2",27.84,88.47,4.39,0.57,10],
  ["SELECT BY STAND","goods","kaigan2",27.84,89.0,6.92,0.57,11],
  ["YELLOW vintage store","goods","kaigan2",27.84,89.53,7.68,0.57,12],
  ["Eanbe","goods","kaigan2",27.84,90.07,2.99,0.57,13],
  ["CARAVAN","goods","kaigan2",27.84,90.6,4.17,0.57,14,null,["キャラバン"]],
  ["お楽しみモール","goods","kaigan6",27.84,93.44,5.04,0.57,1],
  ["全日本棍棒協会","goods","kaigan6",27.84,93.97,7.79,0.57,2],
  ["寄道ハトバ","goods","kaigan6",27.84,94.51,4.0,0.57,3],
  ["CYAARVO","goods","kaigan6",27.84,95.04,4.22,0.57,4],
  ["epina×そうま農園","food","kaigan6",27.84,95.57,5.91,0.57,5],
  ["那須の大きな食卓 by Chus","goods","kaigan6",27.84,96.1,8.15,0.57,6],
  ["pile / ITONAMI","goods","kaigan6",27.84,96.64,5.6,0.57,7],
  ["クライミングスペースＢＯＬＤ","goods","kaigan6",27.84,97.17,8.42,0.57,8],
  ["スラックラインコミュニティシーモンキーズ","goods","kaigan6",27.84,97.7,7.72,0.57,9],
  ["旅するパエリア","food","eatbeat-ichi",38.5,75.71,4.98,0.57,1],
  ["THE BASKET","goods","eatbeat-ichi",38.5,76.24,5.22,0.57,2],
  ["菓子ヒナゲシ","sweets","eatbeat-ichi",38.5,76.77,4.53,0.57,3],
  ["雑踏","goods","eatbeat-ichi",38.5,77.31,2.43,0.57,4],
  ["初耳の台湾","goods","eatbeat-ichi",38.5,77.84,4.09,0.57,5],
  ["怪談商店 おばけ座","goods","eatbeat-ichi",38.5,78.37,5.95,0.57,6],
  ["COFFEE HOUSE punkt.","drink","eatbeat-ichi",38.5,78.91,8.07,0.57,7],
  ["TANJI","goods","eatbeat-ichi",38.5,79.97,3.03,0.57,8],
  ["PlanetaryMuffin","goods","eatbeat-ichi",38.5,80.51,5.85,0.57,9],
  ["AHSO a.k.a. ヅカデン","goods","eatbeat-ichi",38.5,81.04,7.13,0.57,10],
  ["niente","goods","eatbeat-ichi",38.5,81.57,2.94,0.57,11],
  ["LUZeSOMBRA","goods","eatbeat-ichi",38.5,82.1,5.42,0.57,12],
  ["FISH BOWL COOK","goods","eatbeat-ichi",38.5,82.64,6.67,0.57,13],
  ["The Source Diner","food","eatbeat-ichi",38.5,83.17,6.27,0.57,14,null,["ザソースダイナー","ソースダイナー"]],
  ["RiCE おにぎり","sweets","eatbeat-ichi",38.5,83.7,4.76,0.57,15],
  ["スヌーザー 静岡","goods","eatbeat-ichi",38.5,84.24,5.22,0.57,16],
  ["EENYBREAKFAST＆SHOP","goods","eatbeat-ichi",38.5,84.77,9.18,0.57,17],
  ["POCHAおじさん ＆ NOBY","goods","eatbeat-ichi",38.5,85.3,8.18,0.57,18],
  ["VIVOBAREFOOT","goods","eatbeat-ichi",38.5,85.84,6.04,0.57,19],
  ["MONK","goods","eatbeat-ichi",38.5,86.37,3.13,0.57,20],
  ["anytee","goods","eatbeat-ichi",38.5,86.9,3.15,0.57,21],
  ["仁井田本家","goods","eatbeat-ichi",38.5,87.44,4.07,0.57,22],
  ["奈良醸造","goods","eatbeat-ichi",38.5,87.97,3.51,0.57,23],
  ["そば爺よしみ","food","kaigan5",38.54,90.81,6.54,0.57,1,["d1"]],
  ["サキアテジョーグー","goods","kaigan5",38.54,91.87,5.99,0.57,2],
  ["DAN","goods","kaigan5",38.54,92.41,2.59,0.57,3],
  ["yoknel","goods","kaigan5",38.54,93.47,3.17,0.57,5],
  ["立呑み 海と花束","drink","kaigan5",38.54,94.01,5.35,0.57,6],
  ["旅する占いパーム","goods","kaigan5",38.54,94.54,8.93,0.57,7,["d2","d3"]],
  ["旅する珈琲屋SweetMemoriesCoffee","drink","kaigan5",38.54,95.07,12.3,0.57,8],
  ["CAFUNEとREEF KNOT COFFEE","drink","kaigan5",38.54,95.61,11.29,0.57,9],
  ["OMIYAGE","goods","kaigan5",38.54,94.79,4.82,3.09,10],
  ["おみごとスナック御美娘＆聖母呑俗夢　ドリームコラボ","goods","kaigan5",38.54,96.67,15.08,0.57,11],
  ["TWO CHAPATI","goods","kaigan5",38.54,97.2,6.32,0.57,12,null,["ツーチャパティ","トゥーチャパティ"]],
  ["chocobanashi","sweets","kaigan5",38.54,97.74,5.95,0.57,13],
  ["発酵玄米三拍子feat.アワイ","goods","kaigan5",38.54,98.27,8.79,0.57,14],
  ["SUNDAY SPICE","sweets","morimichi-disco",48.84,12.59,5.83,0.57,1],
  ["喫茶hiraya","drink","morimichi-disco",48.84,13.12,4.15,0.57,2],
  ["そのとうり","goods","morimichi-disco",48.84,13.65,3.88,0.57,3],
  ["燦々-sansan-","goods","morimichi-disco",48.84,14.19,6.79,0.57,4],
  ["narusoba","food","morimichi-disco",48.84,14.72,3.9,0.57,5],
  ["だし・麺 未蕾","food","morimichi-disco",48.84,15.25,4.55,0.57,6],
  ["SAVA!STORE","goods","kaigan3",48.95,78.99,5.17,0.57,1],
  ["NAOT","goods","kaigan3",48.95,79.52,3.01,0.57,2,null,["ナオト"]],
  ["スパイスカリー大陸","food","kaigan3",48.95,80.05,6.09,0.57,3],
  ["遠藤マサヒロ","goods","kaigan3",48.95,80.59,4.55,0.57,4],
  ["竹沢むつみ","goods","kaigan3",48.95,81.12,4.05,0.57,5],
  ["jacou / suolo","goods","kaigan3",48.95,82.19,4.72,0.57,7],
  ["BOOK TRUCK","art","kaigan3",48.95,83.25,5.42,0.57,9,null,["ブックトラック","ブック トラック"]],
  ["大衆食堂飯具","food","yuenchi-market",52.6,3.14,4.69,0.57,1],
  ["鮨場まる","food","yuenchi-market",52.6,3.68,3.44,0.57,2],
  ["ARC FARM","goods","yuenchi-market",52.6,4.21,4.46,0.57,3],
  ["The Tiny Seed×BASIL CLUB","goods","yuenchi-market",52.6,4.74,5.96,0.57,4],
  ["SAPERLIPOPETTE さっぺりぽぺっと","goods","yuenchi-market",52.6,5.81,6.81,0.57,5],
  ["13倉庫yeti","goods","yuenchi-market",52.6,6.88,4.08,0.57,6],
  ["森林食堂","food","yuenchi-market",52.6,7.41,5.56,0.57,7,["d1"]],
  ["イチトサンブンノイチ","goods","yuenchi-market",52.6,8.47,6.3,0.57,8],
  ["LAMP:TheSauna","goods","yuenchi-market",52.6,9.01,5.99,0.57,9],
  ["Chè","goods","center-gai",55.3,87.03,2.4,0.57,1],
  ["Origin Store","goods","center-gai",55.3,87.56,4.77,0.57,2],
  ["HOME ECONOMICS EXPERIMENT","goods","center-gai",55.3,88.09,11.24,0.57,3],
  ["SNEAKS by kakuozan larder & earlybirds breakfast","goods","center-gai",55.3,88.63,15.89,0.57,4],
  ["TENTO","goods","center-gai",55.3,89.16,3.4,0.57,5,null,["テント"]],
  ["ヤンガオ／影響亜細亜","goods","center-gai",55.3,89.69,4.22,0.57,6],
  ["再来","goods","center-gai",55.3,90.22,3.19,0.57,7],
  ["Pho321 Noodle bar／影響亜細亜","goods","center-gai",55.3,90.76,7.54,0.57,8],
  ["HEY&Ho.／影響亜細亜","goods","center-gai",55.3,91.29,4.67,0.57,9],
  ["MARA MAX Hi-Fi HQ／影響亜細亜","goods","center-gai",55.3,91.82,10.66,0.57,10,["d1","d2"]],
  ["クリンスイ","goods","center-gai",55.3,92.89,4.54,0.57,11],
  ["影響亜細亜TravelingCOWBOOKS＋PageClimber","art","center-gai",55.3,92.69,13.72,2.25,12],
  ["CultureMountainResearch","goods","center-gai",55.3,95.19,8.39,1.06,16],
  ["ShopKAKUBARHYTHM,Test&Tiny","goods","center-gai",55.3,96.37,11.79,0.82,18],
  ["MAGO FORNI","goods","kaigan4",60.44,81.18,5.23,0.57,1,null,["マーゴフォルニ","マゴフォルニ"]],
  ["稲垣腸詰店","goods","kaigan4",60.44,81.72,4.12,0.57,2],
  ["Quiet Village - California Parlor","goods","kaigan4",60.44,82.25,10.27,0.57,3],
  ["cafeOPEN","drink","kaigan4",60.44,82.78,4.22,0.57,4],
  ["Heritage Ranch Saloon","goods","kaigan4",60.44,83.31,7.85,0.57,5,null,["ヘリテージランチサルーン","ヘリテージ ランチ サルーン"]],
  ["KCOFFEE","drink","yuenchi-market2",61.33,2.43,4.15,0.57,1,null,["ケーコーヒー","ケイコーヒー"]],
  ["Cat's ISSUEと森道大作戦！～うさぎを探せ～","goods","yuenchi-market2",61.33,2.96,8.6,0.57,2],
  ["ENJOY SAUNA by SaunaCamp.","goods","yuenchi-market2",61.33,4.03,10.3,0.57,3],
  ["IN/SECTS","goods","yuenchi-market2",61.33,4.56,4.25,0.57,4],
  ["TIGER MOUNTAIN","goods","yuenchi-market2",61.33,5.1,6.63,0.57,5,null,["タイガーマウンテン","タイガー マウンテン"]],
  ["ホホホ座浄土寺店","goods","yuenchi-market2",61.33,5.63,7.69,0.57,6,["d3"]],
  ["みじカルコレクション","goods","yuenchi-market2",61.33,6.16,6.47,0.57,7],
  ["PORCO","goods","yuenchi-market2",61.33,6.7,3.49,0.57,8],
  ["Ponchice","sweets","yuenchi-market2",61.33,7.23,3.92,0.57,9],
  ["vint.","goods","yuenchi-market2",61.33,7.76,2.42,0.57,10],
  ["musica print works","art","yuenchi-market2",61.33,8.29,9.22,0.57,11,["d2","d3"]],
  ["accessoriesmau×大岡弘晃　and more","goods","yuenchi-market2",61.33,8.83,11.41,0.57,12],
  ["morocco","goods","yuenchi-market2",61.33,9.36,3.77,0.57,13],
  ["Ain.Dah.ing","goods","yuenchi-market2",61.33,9.89,4.5,0.57,14],
  ["まめちゃ／モリミチ喫茶室","drink","yuenchi-market2",61.33,10.43,6.12,0.57,15,["d1"]],
  ["POSTO／モリミチ喫茶室","drink","yuenchi-market2",61.33,12.03,4.15,0.57,16],
  ["円居","goods","yuenchi-market2",61.33,12.56,5.13,0.57,17,["d1"]],
  ["mado cafe／モリミチ喫茶室","drink","yuenchi-market2",61.33,14.16,4.97,0.57,18],
  ["喫茶toi／モリミチ喫茶室","drink","yuenchi-market2",61.33,14.69,5.9,0.57,19,["d1"]],
  ["スコーン家HARU ／モリミチ喫茶室","drink","yuenchi-market2",61.33,15.76,8.42,0.57,20,["d1"]],
  ["senkiya OMOCHI CLUB","goods","east-caravan",72.74,74.55,8.01,0.57,1],
  ["TSUKIMO BAZAAR","goods","east-caravan",72.74,75.08,6.9,0.57,2],
  ["てがみと文字Fluke(フルーク)","goods","east-caravan",72.74,75.61,8.54,0.57,3],
  ["ノックの帽子屋","goods","east-caravan",72.74,76.15,5.02,0.57,4],
  ["ripa","goods","east-caravan",72.74,76.68,2.35,0.57,5],
  ["運麺PARK","food","east-caravan",72.74,77.21,4.1,0.57,6],
  ["電気湯","goods","east-caravan",72.74,77.75,2.99,0.57,7],
  ["どすこいドーナツ休日場所","sweets","east-caravan",72.74,78.28,10.23,0.57,8,["d2","d3"]],
  ["POP.POP.POP","goods","east-caravan",72.74,78.81,5.39,0.57,9],
  ["旅するよしえのにがおえ屋さん","goods","east-caravan",72.74,79.35,8.57,0.57,10],
  ["ぺぺぺ似顔絵店","art","east-caravan",72.74,79.88,5.15,0.57,11],
  ["Jamboree","goods","east-caravan",72.74,80.41,4.04,0.57,12],
  ["Canako Inoue","goods","east-caravan",72.74,80.95,5.16,0.57,13],
  ["YURTAO","goods","east-caravan",72.74,81.48,3.73,0.57,14],
  ["OTTOMO","goods","east-caravan",72.74,82.01,3.96,0.57,15],
  ["ilu kamakura ゆげ","goods","east-caravan",72.74,83.08,6.17,0.57,17],
  ["TPM BREWING","drink","east-caravan",72.74,83.61,8.23,0.57,18,["d2","d3"],["ティーピーエムブリューイング","TPMブルーイング"]],
  ["ヘブンズテーブル","goods","east-caravan",72.74,84.14,7.96,0.57,19,["d2","d3"]],
  ["笹塚ビールスタンド by MASUMOTOYA","drink","east-caravan",72.74,84.68,13.98,0.57,20,["d2","d3"]],
  ["KenichiKondo","goods","east-caravan",72.74,85.21,5.43,0.57,21],
  ["チプカとプクチカ","goods","nagano",74.87,88.11,5.43,0.57,1],
  ["takuramakan","goods","nagano",74.87,88.64,4.95,0.57,2],
  ["NATURAL ANCHORS","goods","nagano",74.87,89.17,7.46,0.57,3],
  ["重澤珈琲","drink","nagano",74.87,89.71,3.56,0.57,4],
  ["TAIKO","goods","nagano",74.87,90.24,3.14,0.57,5],
  ["umi neue","goods","nagano",74.87,90.77,3.85,0.57,6],
  ["Fika","goods","nagano",74.87,91.3,2.48,0.57,7,null,["フィーカ","フィカ"]],
  ["饅頭VERYMUCH","goods","nagano",74.87,91.84,5.87,0.57,8],
  ["風景とみつめるタロット","goods","nagano",74.87,92.37,7.04,0.57,9],
  ["OJAS PURE RAW CHOCOLATE","sweets","nagano",74.87,92.9,10.41,0.57,10,null,["オージャスピュアロウチョコレート","オージャス チョコレート","オジャス"]],
  ["Ph.D.","goods","nagano",74.87,93.44,2.73,0.57,11],
  ["bowks","goods","nagano",74.87,93.97,3.03,0.57,12],
  ["家具屋利右衛門","goods","nagano",74.87,94.5,5.17,0.57,13],
  ["watson pottery studio","art","nagano",74.87,95.04,7.44,0.57,14],
  ["runatsu kobayashi","goods","nagano",74.87,95.57,6.38,0.57,15],
  ["石合昌史","goods","nagano",74.87,96.1,3.46,0.57,16],
  ["POOLSIDE STORE","goods","nagano",74.87,96.63,6.68,0.57,17,null,["プールサイドストア","プールサイド ストア"]],
  ["amijok/NorthSouthEastWest","goods","nagano",74.87,97.17,9.8,0.57,18],
  ["Nobara Homestead Brewery","drink","nagano",74.87,97.7,9.24,0.57,19],
  ["宮下果樹園","goods","nagano",74.87,98.23,4.07,0.57,20],
  ["Chipakoya","goods","play-market",76.73,44.09,4.26,0.57,1],
  ["人々","goods","play-market",76.73,44.63,2.37,0.57,2],
  ["mature ha. Atelier shop","art","play-market",76.73,46.22,7.95,0.57,4],
  ["ざ・デイリーズ","goods","play-market",76.73,46.76,4.74,0.57,5],
  ["メルヘン大蔵のスゲ細工","goods","play-market",76.73,47.29,9.86,0.57,6,["d2","d3"]],
  ["QUE sera sera","goods","play-market",76.73,47.82,5.43,0.57,7],
  ["25ris","goods","play-market",76.73,48.36,2.67,0.57,8],
  ["古道具holo","goods","play-market",76.73,48.89,4.22,0.57,9],
  ["にゃーにゃーごろごろパラダイス","goods","play-market",76.73,49.42,9.04,0.57,10],
  ["ヌノモノワークス","goods","little-okinawa",78.69,55.08,5.42,0.57,1],
  ["atelier sou","art","little-okinawa",78.69,55.61,4.29,0.57,2],
  ["others","goods","little-okinawa",78.69,56.14,3.09,0.57,3],
  ["石垣アパートメント","goods","little-okinawa",78.69,56.68,5.94,0.57,4],
  ["Nantouyaki -南島焼-","goods","little-okinawa",78.69,57.21,6.78,0.57,5],
  ["てすさび","goods","little-okinawa",78.69,57.74,3.42,0.57,6],
  ["イチグスクモード","goods","little-okinawa",78.69,58.27,5.42,0.57,7],
  ["島の装い。STORE","goods","little-okinawa",78.69,58.81,5.9,0.57,8],
  ["commons","goods","little-okinawa",78.69,59.34,4.04,0.57,9],
  ["羊羊 YOYO AN FACTORY","goods","little-okinawa",78.69,59.87,8.41,0.57,10],
  ["GOZZA&MEGU","goods","little-okinawa",78.69,60.41,6.03,0.57,11],
  ["HEY&HARETAKARA","goods","little-okinawa",78.69,60.94,7.11,0.57,12],
  ["Aボールスタンド by 小桜・小梅","goods","little-okinawa",78.69,61.47,8.9,0.57,13],
  ["東京台湾","goods","morimichi-umi",78.71,64.17,3.54,0.57,1],
  ["Rice meals FoTan","sweets","morimichi-umi",78.71,64.7,6.3,0.57,2],
  ["Little Nap COFFEE STAND","drink","morimichi-umi",78.71,65.23,9.03,0.57,3,null,["リトルナップコーヒースタンド","リトルナップ","リトル ナップ コーヒー"]],
  ["麺の樹ぼだい","food","morimichi-umi",78.71,65.77,4.59,0.57,4],
  ["蜜香屋と豆んと森珈琲","drink","fantastic",89.28,59.15,6.78,0.57,1],
  ["さやかのおむすびと堕楽暮","food","fantastic",89.28,59.68,7.81,0.57,2],
  ["FOOD ORCHESTRA x SAN","food","fantastic",89.28,60.22,9.14,0.57,3],
  ["七穀ベーカリー","food","fantastic",89.28,60.75,5.03,0.57,4],
  ["お菓子あずき","sweets","fantastic",89.28,61.28,4.48,0.57,5],
  ["WOOST engine meals / KITSUTSUKI","food","fantastic",89.28,61.81,8.03,0.57,6],
  ["TIMOBAGELS","sweets","fantastic",89.28,62.88,5.53,0.57,7,null,["ティモベーグルズ","ティモベーグル","ティモ ベーグル"]],
  ["COCHI CAFE","drink","fantastic",89.28,63.41,5.1,0.57,8],
  ["かわにし農園","food","fantastic",89.28,63.95,4.52,0.57,9],
  ["さんかくの食卓","goods","fantastic",89.28,64.48,4.93,0.57,10],
  ["野菜居酒屋いたぎ家","drink","fantastic",89.28,65.01,6.21,0.57,11],
  ["graf kitchen","food","fantastic",89.28,65.55,4.59,0.57,12,null,["グラフキッチン","グラフ キッチン"]],
  ["ダイヤメゾン","goods","fantastic",89.28,66.08,4.29,0.57,13],
  ["ダルマワークス","goods","fantastic",89.28,66.61,7.52,0.57,14,["d2","d3"]],
  ["obrarte","goods","fantastic",89.28,67.15,3.3,0.57,15],
  ["TE tea and eating","drink","fantastic",89.28,67.68,6.25,0.57,16],
  ["RISE&WIN Brewing Co./KAMIKATZ BEER","drink","fantastic",89.28,68.21,8.38,0.57,17],
  ["101010(トトト)","goods","fantastic",89.28,69.28,4.96,0.57,18],
  ["hei","goods","fantastic",89.28,69.81,2.07,0.57,19],
  ["HASHIMOTO NAOKO","goods","fantastic",89.28,70.34,7.43,0.57,20],
  ["LIFE IS A JOURNEY! / ihatov","goods","fantastic",89.28,70.88,9.71,0.57,21],
  ["カシューナッツ専門店　豆仁","goods","fantastic",89.28,71.41,8.27,0.57,22],
  ["LACICO","goods","fantastic",89.28,71.94,3.6,0.57,23],
  ["Tubu.","goods","fantastic",89.28,72.48,2.81,0.57,24],
  ["yamyam STORE","goods","fantastic",89.28,73.01,5.88,0.57,25],
  ["UNE TABLE","goods","fantastic",89.28,73.54,7.33,0.57,26,["d2","d3"],["ユヌターブル","ユヌ ターブル","ウネターブル"]],
  ["RAINBOWFAM","goods","fantastic",89.28,74.08,5.47,0.57,27],
  ["RumChai","drink","fantastic",89.28,74.61,3.81,0.57,28],
  ["lovecycle","goods","fantastic",89.28,75.14,3.92,0.57,29],
  ["澤邑直美","goods","fantastic",89.28,75.67,3.52,0.57,30],
  ["saredo -されど-","goods","fantastic",89.28,76.21,5.29,0.57,31],
  ["okapi","goods","fantastic",89.28,76.74,2.81,0.57,32],
  ["泉州と堺の糸へん","goods","fantastic",89.28,77.27,5.68,0.57,33],
  ["奥谷農園","food","fantastic",89.28,77.81,6.12,0.57,34,["d2","d3"]],
  ["maemuki suit!","goods","fantastic",89.28,78.34,5.2,0.57,35],
  ["ぐびっと淡路島！","goods","fantastic",89.28,78.87,5.57,0.57,36],
  ["puro(プーロ)","goods","fantastic",89.28,79.41,7.12,0.57,37,["d2","d3"]],
  ["源次郎商店","goods","shibafu",89.29,82.31,4.13,0.57,1],
  ["KAMOGO","goods","shibafu",89.29,83.38,4.11,0.57,2],
  ["宗像堂","goods","shibafu",89.29,83.91,3.0,0.57,3],
  ["GOOD MORNING FARM","goods","shibafu",89.29,84.44,8.18,0.57,4],
  ["Wrong Market","goods","shibafu",89.29,84.97,5.27,0.57,5],
  ["タイ・モンゴル武者修行商会","goods","shibafu",89.29,85.51,8.14,0.57,6],
  ["ラオス料理タマサート","food","shibafu",89.29,86.04,7.38,0.57,7],
  ["Watte chai","drink","shibafu",89.29,86.57,7.69,0.57,8,["d2","d3"]],
  ["B+ND","goods","shibafu",89.29,87.11,3.75,0.57,9],
  ["SUMI","goods","shibafu",89.29,87.64,3.53,0.57,10],
  ["suba.kyoto","goods","shibafu",89.29,88.17,5.11,0.57,11],
  ["ha ra","goods","shibafu",89.29,88.71,6.04,0.57,12,["d1","d2"]],
  ["３みっつ","goods","shibafu",89.29,90.31,4.11,0.57,13],
  ["四月の魚","goods","shibafu",89.29,90.84,6.8,0.57,14,["d2","d3"]],
  ["magic room","goods","shibafu",89.29,91.37,7.98,0.57,15,["d2","d3"]],
  ["パルメラ","goods","shibafu",89.29,90.86,4.12,2.25,16],
  ["モンゴルパン","food","shibafu",89.29,92.44,5.23,0.57,17],
  ["HOZUBAG","goods","shibafu",89.29,92.97,5.04,0.57,18],
  ["りんご","goods","shibafu",89.29,93.5,3.59,0.57,19],
  ["小林酒店","drink","shibafu",89.29,94.04,4.31,0.57,20],
  ["Sake World","drink","shibafu",89.29,94.57,7.91,0.57,21,["d2","d3"],["サケワールド","酒ワールド","サケ ワールド"]],
  ["BAUM","goods","shibafu",89.29,95.1,6.41,0.57,22,["d1","d2"],["バウム"]],
  ["鴨庭","goods","shibafu",89.29,95.64,3.17,0.57,23],
  ["TARELとcam","goods","shibafu",89.29,96.17,5.7,0.57,24],
  ["山ねこ","goods","shibafu",89.29,96.7,3.69,0.57,25],
  ["タコとケンタロー","goods","shibafu",89.29,97.23,6.22,0.57,26],
  ["VOU/棒","goods","shibafu",89.29,97.77,4.61,0.57,27],

  /* ------- 公式サイト照合で追加した出店（2026-05-22 時点） -------
     公式 morimichiichiba.jp の各エリアページと照合し、未掲載だった店を補完。
     公式マップPDFの座標が無いため [店名, カテゴリ, エリアID] の3要素形式。
     hasMapPos=false となり、マップのハイライト対象外（リスト・検索には出る）。
     カテゴリは店名からの推定。 */
  ["OFF THE RECORD","art","liverary"],
  /* 番号5: カロリー軒[金] と日替わり。土・日のみ出店 */
  ["社交酒場イム","drink","liverary",1.53,5.27,5.92,0.57,5,["d2","d3"]],
  ["BURGER STAND haveagoodtime. x daybyday","food","liverary"],
  ["BASE LAYER HOTEL","goods","liverary",["ベースレイヤーホテル","ベース レイヤー ホテル"]],

  ["岩田商店","goods","eatbeat-ichi"],

  /* 番号16: 公式マップに座標未取得。土・日のみ */
  ["hitoha COFFEE & GRANOLA","drink","east-caravan",72.86,82.54,9.92,0.57,16,["d2","d3"]],

  ["IMAGINE.COFEEE","drink","shimanami"],
  ["エスニックスタンド メイクワンツー","food","shimanami"],
  ["がふ","goods","shimanami"],
  ["KAMERA","goods","shimanami"],
  ["Kougame","goods","shimanami"],
  ["コウボパン小さじいち","food","shimanami"],
  ["goffo","goods","shimanami"],
  ["山窩 -旅とてしごと-","goods","shimanami"],
  ["ジークマンストア","goods","shimanami"],
  ["自然食コタン","food","shimanami"],
  ["鈴木裕之の似顔絵屋さん","art","shimanami"],
  ["TYSON PIZZA","food","shimanami",["タイソンピザ","タイソン ピザ"]],
  ["DADA NUTS BUTTER","food","shimanami",["ダダナッツバター","ダダ ナッツ バター"]],
  ["Tanigaki","goods","shimanami"],
  ["WHW!","goods","shimanami"],
  ["テルツォテンポ","goods","shimanami"],
  ["ドットコミュ","goods","shimanami"],
  ["流しのビリヤニ","food","shimanami"],
  ["nuttsponchon","goods","shimanami"],
  ["NEWHELLOSHOP","goods","shimanami",["ニューハローショップ","ニュー ハロー ショップ"]],
  ["Passific Brewing","drink","shimanami"],
  ["フベン","goods","shimanami"],
  ["FLOAT","goods","shimanami",["フロート"]],
  ["BAILER","goods","shimanami",["ベイラー","ベーラー"]],
  ["ミルク工房そら","sweets","shimanami"],
  ["ヤンフー×イワサトミキ","goods","shimanami",88.5,50.45,7.04,0.57,null,["d2","d3"]],
  ["LA PITA DE MAISON CINQUANTECINQ","food","shimanami"],
  ["wineshop&stand slowcave","drink","shimanami"],

  /* POMO MAISON は土・日のみ。TOKIIRO COFFEE と複合店表記のため複合店としては全日扱い */
  ["TOKIIRO COFFEE ＆ POMO MAISON","drink","play-market"],
  ["hacu","goods","play-market"],
  ["FRECKLE","goods","play-market",["フレックル"]],

  /* 番号4: VAAT[金]とペア。土・日のみ出店 */
  ["EN/ME","goods","ukiuki",16.64,85.45,4.92,0.57,4,["d2","d3"]],
  ["ORANGUTAN","goods","ukiuki"],
  /* 番号19: TANUKI APPETIZING[金]とペア。土・日のみ */
  ["KISO","goods","ukiuki",16.64,94.51,9.46,0.57,19,["d2","d3"]],
  /* 番号20: Blanc a tokyo[金・土]とペア。日のみ */
  ["Slō","goods","ukiuki",16.64,95.58,7.81,0.57,20,["d3"],["スロー","スロウ"]],
  ["TOO WOOD","goods","ukiuki"],
  ["PADDLERS COFFEE","drink","ukiuki",["パドラーズコーヒー","パドラーズ コーヒー","パドラーズ"]],
  /* 番号18: 八方美米・八方美菜[金・土]とペア。日のみ */
  ["山城果樹園","food","ukiuki",16.64,93.45,8.68,0.57,18,["d3"]],
  ["LOU","goods","ukiuki"],

  /* 種と旅と（tane）の日替わり店。番号7-10で時間別に店舗が入れ替わる。
     座標は同番号の代表店（igora=番号4）の近傍を継承しないため null とし、
     マップ非対応の追加店扱い。booth番号は出店日フィルタの確認用。 */
  ["AKITO COFFEE","drink","tane",["アキトコーヒー","アキト コーヒー","アキト珈琲"]],
  ["Appartement coffee","drink","tane",["アパルトモンコーヒー","アパルトマンコーヒー","アパルトモン"]],
  ["ARBOL ICECREAM","sweets","tane",37.65,5.12,6.95,0.57,10,["d1"],["アルボルアイスクリーム","アルボル","アルボル アイス"]],
  ["ALO（アロ）","goods","tane",23.97,6.71,4.53,0.57,8,["d1"]],
  ["伊藤渉","goods","tane",24.29,2.99,2.84,0.57,7,["d1"]],
  ["Ethnic tam＋neutral","goods","tane",24.29,8.32,6.72,0.57,8,["d2"]],
  ["HOWENE","goods","tane"],
  ["お酒と料理えいよう","food","tane",24.29,8.84,5.99,0.57,8,["d2"]],
  ["カルパ","goods","tane",38.29,8.32,2.42,0.57,9,["d3"]],
  ["樹和堂","goods","tane",38.29,6.19,2.52,0.57,9,["d1"]],
  ["sagoggio","goods","tane",24.29,5.12,3.75,0.57,7,["d2"]],
  ["sundaysfood","food","tane",37.97,3.51,4.76,0.57,9,["d2"]],
  ["Sunday Bake Shop","sweets","tane",38.29,6.71,6.17,0.57,9,["d2"],["サンデーベイクショップ","サンデー ベイク ショップ"]],
  ["SUNPEDAL（サンペダル）","goods","tane",23.97,2.44,8.32,0.57,7,["d1"]],
  ["csew","goods","tane",24.29,9.39,2.61,0.57,8,["d3"]],
  ["自然派料理店　糧","food","tane",24.29,4.57,5.67,0.57,7,["d2"]],
  ["チェスト","goods","tane",38.29,8.84,2.84,0.57,9,["d3"]],
  ["月とピエロ","goods","tane",37.97,4.57,3.8,0.57,9,["d3"]],
  ["Tearoom Alpes","drink","tane",37.65,2.44,5.81,0.57,9,["d1"],["ティールームアルプス","ティールーム アルプス","アルプス"]],
  ["nai","goods","tane"],
  ["パーラー江古田","food","tane",38.29,9.39,4.62,0.57,9,["d3"]],
  ["Patisserie RaRe","sweets","tane",38.29,7.77,10.29,0.57,9,["d2"],["パティスリーラーレ","パティスリーラール","パティスリー ラーレ","パティスリー","ラーレ"]],
  ["パン屋 塩見","food","tane",38.29,10.45,3.61,0.57,9,["d3"]],
  ["Bèe","goods","tane",24.29,7.26,2.24,0.57,8,["d1"]],
  ["ひのめ","goods","tane",24.29,5.64,2.84,0.57,7,["d3"]],
  ["Peg","goods","tane",24.29,9.91,2.24,0.57,8,["d3"]],
  ["boat","goods","tane",24.29,7.77,2.42,0.57,8,["d2"]],
  ["薪火野","food","tane",38.29,7.26,2.52,0.57,9,["d2"]],
  ["MUBE","goods","tane",37.97,4.06,2.93,0.57,9,["d3"]],
  ["湯宿 蒸気家 feat. Yusuke Kashima","goods","tane",24.29,3.51,10.29,0.57,7,["d1"]],
  ["ラ・ブーランジェリー・ド・ハリマヤ","food","tane",38.29,5.64,9.05,0.57,9,["d1"]],
  ["Ryohei Takamatsu","art","tane",37.97,2.99,6.4,0.57,9,["d1"]],
  ["ワイン食堂トキワ","drink","tane",24.29,6.19,5.44,0.57,7,["d3"]],
  ["wineshop flow","drink","tane"],
  /* hnn[日 16:00-] と ルヴァン甲田幹夫[日 16:00-] も番号9。
     既存データに未登録のため新規追加。 */
  ["hnn","food","tane",38.29,9.91,1.83,0.57,9,["d3"]],
  ["ルヴァン甲田幹夫","food","tane",38.29,10.97,5.12,0.57,9,["d3"]],

  ["Chè 333","sweets","center-gai"],
  ["MMF／影響亜細亜 Culture Shop","goods","center-gai"],
  ["OM sabaisabai／影響亜細亜 Culture Shop","goods","center-gai"],
  ["QUIET SPACE TOOL & FURNITURE／影響亜細亜 Culture Shop","goods","center-gai"],
  ["DIGAWEL／影響亜細亜 Culture Shop","goods","center-gai"],
  ["24PILLARS／影響亜細亜 Culture Shop","goods","center-gai"],
  /* center-gai 番号10: MARA MAX Hi-Fi HQ[金・土]とペア。日のみ */
  ["TOKYO CULTUART by BEAMS／影響亜細亜","goods","center-gai",55.3,91.82,10.66,0.57,10,["d3"]],
  ["Highway（南国灰道倶楽部）／影響亜細亜 Culture Shop","goods","center-gai"],
  ["BE A GOOD NEIGHBOR COFFEE KIOSK／影響亜細亜 Culture Shop","drink","center-gai"],

  ["農・豊・賛／nopposan","food","kaigan5"],
  /* PDFテキスト上の位置からはウキウキ通り番号14（青果ミコト屋）とペア
     とも読めるが、既存データの kaigan5 を踏襲。土・日のみ */
  ["森道結婚式＆海岸美容院","goods","kaigan5",38.93,91.36,7.27,0.57,null,["d2","d3"]],

  ["affordance + Onawa","goods","kaigan3"],
  ["SNOW SHOVELING [Caravan]","goods","kaigan3"],

  ["TORAYA EQUIPMENT","goods","kaigan2"],

  /* 番号7: 森林食堂[金]とペア。土・日のみ */
  ["O2","goods","yuenchi-market",52.6,7.41,5.56,0.57,7,["d2","d3"]],

  /* モリミチ喫茶室の日替わり店（番号15-20） */
  ["oyatsupokke／モリミチ喫茶室","food","yuenchi-market2",61.33,15.76,8.42,0.57,20,["d2","d3"]],
  ["space／モリミチ喫茶室","drink","yuenchi-market2",61.33,14.69,5.9,0.57,19,["d2","d3"]],
  ["deli＆tea käwäsemi／モリミチ喫茶室","drink","yuenchi-market2",61.33,10.43,6.12,0.57,15,["d2"]],
  ["ヒトトキ -人と木-／モリミチ喫茶室","drink","yuenchi-market2",61.33,10.43,6.12,0.57,15,["d3"]],
  ["Felt coffee／モリミチ喫茶室","drink","yuenchi-market2",61.33,12.56,5.13,0.57,17,["d2","d3"]],
  ["uneclef／モリミチ喫茶室","drink","yuenchi-market2",61.33,14.16,4.97,0.57,18,["d2","d3"]],

  /* venture 番号23: 中囿 義光とペア。日のみ。エリアは shibafu ではなく venture
     とすべきだが、既存データの互換性を保つため shibafu のまま保持。 */
  ["Nowhereman","goods","shibafu",90.06,89.26,5.3,0.57,null,["d3"]],
  /* nagano 番号4: 重澤珈琲とペア。日のみ */
  ["Méton","goods","shibafu",90.06,89.77,3.34,0.57,null,["d3"]],
  ["ゆとなみ社","goods","shibafu"],
  ["和歌山酒場","drink","shibafu"],

  /* VENTURE ONWARD by Purveyors の未掲載分（公式 /area/ 再照合で判明） */
  ["アトリエブルーボトル","goods","venture"],
  ["稲とアガベ","drink","venture"],
  ["ココ・ファーム・ワイナリー","drink","venture"],
  ["一二","goods","venture",1.84,72.68,2.29,0.57,null,["d2","d3"]],
  ["Purveyors","goods","venture"],
  ["Hi Hi Hi","goods","venture"],
  ["ぷくぷく醸造","drink","venture"],
  ["芙蓉酒造","drink","venture"],
  ["PLusBeat-月のうらがわ-","goods","venture"],
  ["BRING","goods","venture",["ブリング"]],
  ["mörk","sweets","venture",["モルク","モーク","モーラック"]],
  ["WONDER WORKS","goods","venture",2.85,74.81,5.4,0.57,null,["d2","d3"]]

];

/* ------- 自動生成（編集不要） ------- */
const CAT = {
  food:  { label: 'フード',           icon: '🍜' },
  drink: { label: 'ドリンク',          icon: '🍺' },
  sweets:{ label: 'スイーツ',          icon: '🍩' },
  goods: { label: '雑貨・ファッション', icon: '🛍️' },
  art:   { label: 'アート・本・レコード', icon: '🎨' }
};
const ZONE_BY_ID = {};
ZONES.forEach(z => ZONE_BY_ID[z.id] = z);

const ARTISTS = ARTIST_DATA.map((a, i) => ({
  id: 'a' + i, name: a.name, days: a.days || [],
  /* aliases … 英語名と日本語カナ名を相互検索でヒットさせるための別名群。
     例：英語名アーティストにカタカナ表記を付与。未指定なら空配列扱い。 */
  aliases: Array.isArray(a.aliases) ? a.aliases.slice() : []
}));

const SHOPS = SHOP_DATA.map((s, i) => {
  /* 形式が 3要素（座標なし）と 8〜10要素（座標あり）の2系統あるため、
     座標なし形式では4番目以降の配列要素を days / aliases として柔軟に解釈する。
       3要素: [name, cat, zone]
       4要素: [name, cat, zone, daysOrAliases]
       5要素: [name, cat, zone, days, aliases]
       8〜10要素: [name, cat, zone, x, y, w, h, booth, days?, aliases?] */
  let name, cat, zone, x, y, w, h, booth, days, aliases;
  if (s.length <= 5 && (s.length < 4 || !(typeof s[3] === 'number'))) {
    [name, cat, zone] = s;
    /* 残りの要素は配列のはず（days か aliases） */
    const extras = s.slice(3).filter(Array.isArray);
    if (extras.length === 1) {
      /* 1個だけ → 中身が 'd1' などなら days、それ以外なら aliases */
      const arr = extras[0];
      if (arr.length && typeof arr[0] === 'string' && /^d[123]$/.test(arr[0])) days = arr;
      else aliases = arr;
    } else if (extras.length >= 2) {
      days = extras[0]; aliases = extras[1];
    }
  } else {
    [name, cat, zone, x, y, w, h, booth, days, aliases] = s;
  }
  const z = ZONE_BY_ID[zone];
  const c = CAT[cat] || { label: '', icon: '🛍️' };
  /* hasMapPos … 公式マップPDFの座標を持つ店か。座標なしの追加店は
     マップのハイライト・ピン処理から除外する（falseならマップ非対応）。 */
  const hasMapPos = typeof x === 'number' && x > 0;
  /* days … 出店日（['d1','d2','d3'] のサブセット）。
     未指定または空配列は全日出店扱い（=フィルタを通る）。 */
  const dayList = Array.isArray(days) && days.length ? days.slice() : null;
  return {
    id: 's' + i, name, cat,
    catLabel: c.label, catIcon: c.icon,
    zone, zoneName: z ? z.name : '',
    booth: booth || null,              // 公式マップのブース番号
    hasMapPos,
    mx: x, my: y, mw: w, mh: h,        // マップ上の店名ハイライト矩形（%）
    days: dayList,                     // null=全日 / 配列=指定日のみ
    /* aliases … 検索の別名（英⇄カナ・通称・誤読対応）。任意。
       例：["ミナペルホネン","ミナ ペルホネン"] */
    aliases: Array.isArray(aliases) ? aliases.slice() : []
  };
});

/* ある店が指定日に出店するか。days が null なら全日扱い。 */
const shopOpenOn = (s, dayId) => !s.days || s.days.indexOf(dayId) !== -1;

/* エリア名ラベルの位置（公式PDFから抽出した正規化矩形 %）。形式 [x%,y%,幅%,高さ%]。

   ZONE_LABEL_LIST … 出店一覧ブロックの「見出し（エリア名）」の位置。
                     ＝ その店の名前が記載されているエリア名。
   ZONE_VENUE      … 会場マップ（中央の地図）上に描かれたエリア名の位置。
                     ＝ そのエリアが実際にマップ上のどこにあるか。
   中央地図に独立したエリア名表記が無いエリアは出店一覧側と同じ位置。 */
const ZONE_LABEL_LIST = {
  'liverary':        [1.5,1.2,7.3,1.0],
  'tane':            [16.2,1.2,3.7,1.0],
  'river-market':    [1.5,46.2,7.9,1.0],
  'kyoryu':          [13.4,46.2,4.3,1.0],
  'venture':         [1.5,69.2,10.0,1.0],
  'ukiuki':          [16.6,82.6,5.4,1.0],
  'yuenchi-market':  [52.6,1.0,8.0,1.4],
  'yuenchi-market2': [61.3,1.1,7.4,1.0],
  'morimichi-disco': [48.8,11.3,10.6,1.0],
  'morimichi-umi':   [78.7,62.9,8.3,1.0],
  'play-market':     [76.7,42.8,7.5,1.0],
  'little-okinawa':  [78.7,53.8,6.2,1.0],
  'fantastic':       [89.3,57.3,7.7,1.0],
  'east-caravan':    [72.7,73.3,8.2,1.0],
  'eatbeat-ichi':    [38.5,74.4,6.2,1.0],
  'kaigan1':         [27.8,75.8,6.4,1.0],
  'kaigan2':         [27.8,81.9,6.5,1.0],
  'kaigan3':         [49.0,77.7,6.5,1.0],
  'kaigan4':         [60.4,79.9,6.5,1.0],
  'kaigan5':         [38.5,89.5,6.5,1.0],
  'kaigan6':         [27.8,92.2,6.5,1.0],
  'center-gai':      [55.3,85.7,6.4,1.0],
  'nagano':          [74.9,86.8,4.6,1.0],
  'shibafu':         [89.3,81.0,5.9,1.0]
};
const ZONE_VENUE = {
  'liverary':        [23.9,17.8,3.8,0.5],
  'tane':            [14.2,12.3,1.9,0.5],
  'river-market':    [19.7,36.1,4.1,0.6],
  'kyoryu':          [15.5,28.7,4.6,0.6],
  'venture':         [17.5,63.0,6.0,5.0],
  'ukiuki':          [24.0,68.0,6.0,6.0],
  'yuenchi-market':  [52.5,21.5,6.0,3.0],
  'yuenchi-market2': [52.5,21.5,6.0,3.0],
  'morimichi-disco': [69.5,30.7,2.0,0.5],
  'morimichi-umi':   [69.0,62.5,2.0,0.5],
  'play-market':     [47.1,45.1,3.9,0.6],
  'little-okinawa':  [65.0,58.2,3.2,0.6],
  'fantastic':       [59.2,64.7,4.0,0.6],
  'east-caravan':    [46.9,58.7,2.6,0.9],
  'eatbeat-ichi':    [32.5,57.3,3.2,0.5],
  'kaigan1':         [28.5,49.2,5.0,0.7],
  'kaigan2':         [36.5,52.2,5.0,0.7],
  'kaigan3':         [51.8,55.9,2.4,0.7],
  'kaigan4':         [56.1,73.2,3.4,0.6],
  'kaigan5':         [46.1,69.4,3.3,0.5],
  'kaigan6':         [36.0,67.3,3.4,0.5],
  'center-gai':      [42.0,54.7,5.0,0.7],
  'nagano':          [74.9,86.8,4.6,1.0],
  'shibafu':         [55.8,69.0,3.0,0.5]
};

/* エリアごとの範囲（出店一覧ブロックの外接矩形）。
   ショップ選択時、そのエリアをマップ上で色付きハイライトするのに使う。 */
const ZONE_BOX = {};
SHOPS.forEach(s => {
  if (!s.hasMapPos) return;            // 座標なしの追加店は外接矩形に含めない
  const b = ZONE_BOX[s.zone] ||
    (ZONE_BOX[s.zone] = { x0: 100, y0: 100, x1: 0, y1: 0 });
  b.x0 = Math.min(b.x0, s.mx);
  b.y0 = Math.min(b.y0, s.my);
  b.x1 = Math.max(b.x1, s.mx + s.mw);
  b.y1 = Math.max(b.y1, s.my + s.mh);
});
