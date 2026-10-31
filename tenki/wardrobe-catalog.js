// 共通カタログ。通常の script として読み込み、file:// でも動作します。
(() => {
  const tiers = [
 {max:0,title:'真冬のしっかり防寒',description:'厚手のダウンに、首元まであたたかい小物を合わせて。',color:'#667d71',layer:'#e5d4ba',kind:'coat',scarf:true},
 {max:5,title:'厚手コートであたたかく',description:'ニットの上に厚手のコートを重ねて、冷たい空気に備えましょう。',color:'#a38b77',layer:'#f5ead9',kind:'coat',scarf:true},
 {max:10,title:'コートとニットの重ね着',description:'コートの下にニットを合わせると、寒い時間も安心です。',color:'#879886',layer:'#eee4d5',kind:'coat'},
 {max:14,title:'軽めのコートを羽織って',description:'長袖に軽いコートを重ねて、気温の変化に対応しましょう。',color:'#c2a78a',layer:'#f5eee1',kind:'coat'},
 {max:17,title:'ジャケットがちょうどいい',description:'長袖にジャケットをプラス。脱ぎ着できる組み合わせがおすすめ。',color:'#829489',layer:'#f3e9d9',kind:'jacket'},
 {max:20,title:'薄手ニットで心地よく',description:'薄手のニットやスウェット一枚で過ごしやすい装いに。',color:'#cfb394',layer:'#f1e8da',kind:'sweater'},
 {max:23,title:'長袖シャツで軽やかに',description:'風通しのよい長袖シャツが活躍。羽織りとしても使えます。',color:'#b1c3b3',layer:'#f9f4e9',kind:'shirt'},
 {max:26,title:'半袖に薄手の羽織り',description:'半袖を基本に、冷房や日差しに備えて薄手の一枚を。',color:'#d4bc9b',layer:'#fff8ec',kind:'jacket'},
 {max:30,title:'半袖で涼しく',description:'通気性のよい半袖で、身軽に過ごしましょう。',color:'#e0c7a5',layer:'#fff8ec',kind:'short'},
 {max:Infinity,title:'涼しさ優先の軽い服装',description:'薄手で風通しのよい服を選んで、暑さに備えましょう。',color:'#bbd0bf',layer:'#fff8ec',kind:'short'}
];
  const labels = [
    [['ダウン＋リブタートル','ダウン＋ケーブルニット'],['防寒チェルシーブーツ','防寒レースアップブーツ']],
    [['厚手コート＋タートル','厚手コート＋ケーブルニット'],['ショートブーツ','レースアップブーツ']],
    [['コート＋リブニット','コート＋ハイネックニット'],['ショートブーツ','レザースニーカー']],
    [['薄手コート＋ニット','薄手コート＋シャツ'],['ショートブーツ','ローファー']],
    [['ジャケット＋薄手ニット','ジャケット＋ブラウス'],['ローファー','白スニーカー']],
    [['薄手ニット','長袖シャツ'],['ローファー','スニーカー']],
    [['コットン長袖シャツ','ボウタイ長袖ブラウス'],['ローファー','スニーカー']],
    [['半袖T＋薄手カーディガン','半袖ブラウス＋シアーシャツ'],['ローファー','スニーカー']],
    [['半袖パフスリーブ','半袖リネンシャツ'],['サンダル','スニーカー']],
    [['涼感ノースリーブ','風通しのよい半袖'],['サンダル','スニーカー']]
  ];
  tiers.forEach((tier,index) => {
    tier.id = 'tier' + String(index + 1).padStart(2,'0');
    tier.topLabels = labels[index][0];
    tier.shoeLabels = labels[index][1];
    const lower = index ? tiers[index-1].max : -Infinity;
    tier.range = lower === -Infinity ? '0°C未満' : tier.max === Infinity ? '30°C以上' : lower + '〜' + tier.max + '°C未満';
  });
  function getTier(id) { return tiers.find(tier => tier.id === id); }
  function forTemperature(value) {
    if (!Number.isFinite(value)) throw new TypeError('体感温度が不正です');
    return tiers.find(tier => value < tier.max);
  }
  function imagePath(id, top = 0, shoes = 0) {
    if (!getTier(id) || ![0,1].includes(top) || ![0,1].includes(shoes)) throw new RangeError('コーディネートが不正です');
    return 'images/wardrobe/' + id + '-t' + top + '-s' + shoes + '.png';
  }
  window.OutfitWardrobe = { tiers, getTier, forTemperature, imagePath, forecastTierId: null };
})();
