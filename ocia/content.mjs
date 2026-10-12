import {scripturalMysterySets} from './mysteries.mjs?v=20261012-prayer-beads';

export const sources = {
  mass:'https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass',
  rosary:'https://www.usccb.org/how-to-pray-the-rosary',
  permissions:'https://www.icelweb.org/copyright.htm'
};

const prayerInfo = {
  fatima:['Other Prayers','A prayer asking Jesus for mercy.','You can include this prayer in your prayer set and choose how many times to repeat it.'],
  apostlesCreed:['Creeds','A concise profession of Christian faith.','A creed is a statement of belief. This is the creed commonly used at the beginning of the Rosary. It is distinct from the Nicene Creed.'],
  niceneCreed:['Creeds','The fuller creed familiar from Sunday Mass.','This creed expresses the faith shared by the Church. Your instructor can help explain unfamiliar language, including “consubstantial”: of the same substance or nature.'],
  ourFather:['Essentials',"The prayer Jesus taught his disciples.",'“Our Father” and “the Lord’s Prayer” name the same prayer. This is its devotional form; the sequence at Mass continues differently after “deliver us from evil.”'],
  hailMary:['Essentials','A prayer asking Mary to pray for us.','Catholics ask Mary to pray for them, as they ask other Christians to pray for them. Worship belongs to God. “Thee” and “thy” mean “you” and “your.”'],
  gloryBe:['Essentials','A short prayer of praise to the Trinity.','This prayer praises the Father, the Son, and the Holy Spirit. It is not the longer Gloria sung or recited at Mass.'],
  gloria:['Other Prayers','The longer hymn of praise used at Mass.','The Gloria is different from the short Glory Be. Whether it is included depends on the celebration and the liturgical season.'],
  comeHolySpirit:['Daily Prayer','An invitation to the Holy Spirit.','This prayer asks for the Holy Spirit’s presence and help.'],
  hailHolyQueen:['Other Prayers','A prayer often said at the end of the Rosary.','This prayer asks for Mary’s intercession. Your instructor can explain its traditional imagery and language.'],
  rosaryCollect:['Other Prayers','A closing prayer after the Rosary.','Ask God to help us imitate the mysteries of the Rosary and receive what they promise.'],
  actOfContrition:['Essentials','A prayer expressing sorrow for sin.','This is one traditional form. Other approved forms are also used; the words your parish teaches may differ.'],
  graceBeforeMeals:['Daily Prayer','Giving thanks before a meal.','Grace is a prayer of thanksgiving. This traditional form is often used before eating.'],
  guardianAngel:['Daily Prayer','Asking your guardian angel for protection.','This short traditional prayer asks for guidance and protection throughout the day.'],
  stMichael:['Other Prayers','A prayer for protection and help.','This devotional prayer asks Saint Michael the Archangel for protection. It is not a replacement for any part of Mass.']
};

export const mysterySets = [
  {key:'joyful',name:'Joyful',theme:'Joy in the coming of Jesus and his childhood.',days:'Monday & Saturday',image:'images/annunciation.jpg'},
  {key:'luminous',name:'Luminous',theme:'Jesus as the light of the world, revealed through his public ministry.',days:'Thursday',image:'images/baptism-of-the-lord.jpg'},
  {key:'sorrowful',name:'Sorrowful',theme:'Jesus’ suffering and death for our salvation.',days:'Tuesday & Friday',image:'images/agony-in-the-garden.jpg'},
  {key:'glorious',name:'Glorious',theme:'The Resurrection, the gift of the Holy Spirit, and the heavenly glory of Jesus and Mary.',days:'Wednesday & Sunday',image:'images/resurrection.jpg'}
];

// Devotional reading turns; the original prayer text stays intact for other views.
const prayerTurnStarts = {
  cross:['Amen.'],
  apostlesCreed:['I believe in the Holy Spirit'],
  niceneCreed:['I believe in the Holy Spirit'],
  ourFather:['Give us this day'],
  hailMary:['Holy Mary, Mother of God'],
  gloryBe:['as it was in the beginning'],
  gloria:['Lord Jesus Christ, Only Begotten Son'],
  comeHolySpirit:['Send forth Thy Spirit'],
  hailHolyQueen:['Queen of the Most Holy Rosary','That we may be made worthy'],
  rosaryCollect:['May the divine assistance','May the souls of the faithful departed'],
  graceBeforeMeals:['Amen.'],
  guardianAngel:['ever this day be at my side'],
  stMichael:['May God rebuke him'],
  actOfContrition:['I firmly resolve']
};

function createPrayerParts(id,text) {
  if(id==='fatima')return [{role:'Everyone',text}];
  const roles=['hailHolyQueen','rosaryCollect'].includes(id)?['Everyone','Leader','Response']:null;
  const starts=[0];
  for(const marker of prayerTurnStarts[id]) {
    const start=text.indexOf(marker,starts.at(-1)+1);
    if(start<0)throw new Error(`Missing devotional reading turn for ${id}: ${marker}`);
    starts.push(start);
  }
  return starts.map((start,index)=>({
    role:roles?roles[index]:index%2?'Response':'Leader',
    text:text.slice(start,starts[index+1]).trim().replace(/^[VR]\.\s*/, '')
  }));
}

export function createCatalog(data) {
  const catalog = new Map();
  catalog.set('cross',{id:'cross',name:'Sign of the Cross',kind:'prayer',category:'Essentials',summary:'A prayer in the name of the Trinity.',text:'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',explanation:'Catholics begin and end many prayers with the Sign of the Cross. Follow your instructor’s demonstration if this gesture is new to you.'});
  for (const [id,prayer] of Object.entries(data.prayers)) {
    const [category,summary,explanation] = prayerInfo[id];
    catalog.set(id,{id,...prayer,kind:'prayer',category,summary,explanation});
  }
  for(const item of catalog.values())item.parts=createPrayerParts(item.id,item.text);
  catalog.get('ourFather').readerTitle='Lord’s Prayer (Our Father)';
  for (const set of mysterySets) data.mysteries[set.key].list.forEach(([name,desire,meditation,image],index) => {
    const id = `${set.key}-${index+1}`;
    const {name:readerTitle,scripture,citation}=scripturalMysterySets[set.key][index];
    catalog.set(id,{id,name,readerTitle,scripture,citation,kind:'mystery',category:`${set.name} Mysteries`,summary:set.theme,order:index+1,desire,text:meditation,image,
      explanation:'A mystery is something to contemplate, not a riddle to solve. Pause with this scene; you do not need to produce a particular feeling or have every answer.'});
  });
  return catalog;
}

export {massSections} from './mass.mjs?v=20261012-prayer-opening';
