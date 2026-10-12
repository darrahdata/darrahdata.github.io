export const sources = {
  mass:'https://www.usccb.org/prayer-and-worship/the-mass/order-of-mass',
  rosary:'https://www.usccb.org/how-to-pray-the-rosary',
  permissions:'https://www.icelweb.org/copyright.htm'
};

const prayerInfo = {
  fatima:['Other Prayers','A prayer asking Jesus for mercy.','You can include this prayer in your class set and choose how many times to repeat it.'],
  apostlesCreed:['Creeds','A concise profession of Christian faith.','A creed is a statement of belief. This is the creed commonly used at the beginning of the Rosary. It is distinct from the Nicene Creed.'],
  niceneCreed:['Creeds','The fuller creed familiar from Sunday Mass.','This creed expresses the faith shared by the Church. Your instructor can help explain unfamiliar language, including “consubstantial”: of the same substance or nature.'],
  ourFather:['Essentials',"The prayer Jesus taught his disciples.",'“Our Father” and “the Lord’s Prayer” name the same prayer. This is its devotional form; the sequence at Mass continues differently after “deliver us from evil.”'],
  hailMary:['Essentials','A prayer asking Mary to pray for us.','Catholics ask Mary to pray for them, as they ask other Christians to pray for them. Worship belongs to God. “Thee” and “thy” mean “you” and “your.”'],
  gloryBe:['Essentials','A short prayer of praise to the Trinity.','This prayer praises the Father, the Son, and the Holy Spirit. It is not the longer Gloria sung or recited at Mass.'],
  gloria:['Other Prayers','The longer hymn of praise used at Mass.','The Gloria is different from the short Glory Be. Whether it is included depends on the celebration and the liturgical season.'],
  comeHolySpirit:['Daily Prayer','An invitation to the Holy Spirit.','This prayer asks for the Holy Spirit’s presence and help.'],
  hailHolyQueen:['Other Prayers','A prayer often said at the end of the Rosary.','This prayer asks for Mary’s intercession. Your instructor can explain its traditional imagery and language.'],
  actOfContrition:['Essentials','A prayer expressing sorrow for sin.','This is one traditional form. Other approved forms are also used; the words your parish teaches may differ.'],
  graceBeforeMeals:['Daily Prayer','Giving thanks before a meal.','Grace is a prayer of thanksgiving. This traditional form is often used before eating.'],
  guardianAngel:['Daily Prayer','Asking your guardian angel for protection.','This short traditional prayer asks for guidance and protection throughout the day.'],
  stMichael:['Other Prayers','A prayer for protection and help.','This devotional prayer asks Saint Michael the Archangel for protection. It is not a replacement for any part of Mass.']
};

export const mysterySets = [
  {key:'joyful',name:'Joyful',theme:'The Coming of Jesus',days:'Monday & Saturday',image:'images/annunciation.jpg'},
  {key:'luminous',name:'Luminous',theme:'The Public Ministry of Jesus',days:'Thursday',image:'images/baptism-of-the-lord.jpg'},
  {key:'sorrowful',name:'Sorrowful',theme:'The Suffering and Death of Jesus',days:'Tuesday & Friday',image:'images/agony-in-the-garden.jpg'},
  {key:'glorious',name:'Glorious',theme:'Resurrection and the Hope of Heaven',days:'Wednesday & Sunday',image:'images/resurrection.jpg'}
];

export function createCatalog(data) {
  const catalog = new Map();
  catalog.set('cross',{id:'cross',name:'Sign of the Cross',kind:'prayer',category:'Essentials',summary:'A prayer in the name of the Trinity.',text:'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',explanation:'Catholics begin and end many prayers with the Sign of the Cross. Follow your instructor’s demonstration if this gesture is new to you.'});
  for (const [id,prayer] of Object.entries(data.prayers)) {
    const [category,summary,explanation] = prayerInfo[id];
    catalog.set(id,{id,...prayer,kind:'prayer',category,summary,explanation});
  }
  for (const set of mysterySets) data.mysteries[set.key].list.forEach(([name,desire,meditation,image],index) => {
    const id = `${set.key}-${index+1}`;
    catalog.set(id,{id,name,kind:'mystery',category:`${set.name} Mysteries`,summary:set.theme,order:index+1,desire,text:meditation,image,
      explanation:'A mystery is something to contemplate, not a riddle to solve. Pause with this scene; you do not need to produce a particular feeling or have every answer.'});
  });
  return catalog;
}

export const questions = [
  ['Do I Need to Know the Prayers Already?','No. You can read every word, listen first, or join in as you become comfortable. There is no memorization test before you can pray with your class.'],
  ['Which Prayers Should I Learn First?','Begin with the Sign of the Cross, Our Father, Hail Mary, and Glory Be. As you become comfortable, learn the Apostles’ Creed, Act of Contrition, and the responses you hear at Mass. Your instructor can help you learn at your own pace.'],
  ['What Does “Amen” Mean?','It expresses agreement and trust: “so be it.” It is more than a signal that a prayer is over.'],
  ['Are the Apostles’ Creed and Nicene Creed the Same?','They are two distinct professions of Christian faith. Both are included here under Creeds, with their full wording.'],
  ['Is the Rosary Part of Mass?','No. The Rosary is a devotion that can be prayed alone or together. Mass is the Church’s Eucharistic celebration.'],
  ['What Is a Decade?','In the traditional Rosary, a decade includes an Our Father, ten Hail Marys, and a Glory Be while contemplating a mystery. A class can study a mystery without praying a full decade.'],
  ['What If I Lose My Place?','You can return to the contents of your class set and select the current prayer. Your progress is saved on this device when browser storage is available.'],
  ['What Should I Do at Communion?','Ask your OCIA instructor about your situation before Mass. If you are not receiving Communion, you may remain in your place and pray. Do not assume enrollment in OCIA means you should receive Communion.']
];

// Includes brief responses, the existing prayer library, and user-supplied I confess wording.
// Other longer missing forms stay explicitly marked until an authorized parish source is supplied.
export const massSections = [
  {id:'gather',name:'We Gather',formal:'Introductory Rites',summary:'The assembly comes together and prepares to pray.',items:[
    {id:'greeting',name:'Entrance & Greeting',note:'Join the entrance song. After the Sign of the Cross, respond Amen. The greeting may vary; the assembly’s response remains the same.',responses:[
      {label:'After the Sign of the Cross · Everyone',text:'Amen.'},
      {label:'In Response to the Greeting · Everyone',text:'And with your spirit.'}
    ]},
    {id:'penitential',name:'Penitential Act',note:'Only one form is used. Your parish may instead use a rite of blessing and sprinkling on appropriate occasions.',options:[
      {id:'a',name:'Form A · I Confess',responses:[
        {label:'Everyone · I Confess',text:'I confess to the Almighty God and to you, my brothers and sisters, that I’ve greatly sinned in my thoughts and in my words, in what I’ve done and what I’ve failed to do, through my fault, through my fault, through my most grievous fault.\n(Tap your chest.)\nTherefore I ask the Blessed Mary, ever Virgin, and all the angels and saints to pray for me to the Lord our God. Amen.'},
        {label:'After the Priest’s Concluding Prayer · Everyone',text:'Amen.'},
        {label:'Kyrie · Responses as Led',text:'Lord, have mercy.\nChrist, have mercy.\nLord, have mercy.'}
      ]},
      {id:'b',name:'Form B · Dialogue',pending:'The two dialogue responses are awaiting an authorized text source.',responses:[{label:'After the Priest’s Concluding Prayer · Everyone',text:'Amen.'},{label:'Kyrie · Responses as Led',text:'Lord, have mercy.\nChrist, have mercy.\nLord, have mercy.'}]},
      {id:'c',name:'Form C · Invocations',note:'The leader introduces each invocation. Follow the response that is given; invocations and language can vary.',responses:[{label:'Common English Responses · Everyone',text:'Lord, have mercy.\nChrist, have mercy.\nLord, have mercy.'},{label:'After the Priest’s Concluding Prayer · Everyone',text:'Amen.'}]},
      {id:'sprinkling',name:'Blessing & Sprinkling',note:'The blessing, song, and other texts depend on the celebration. Follow the priest and cantor.',responses:[{label:'After the Priest’s Concluding Prayer · Everyone',text:'Amen.'}]}
    ]},
    {id:'gloria',name:'Gloria',note:'This longer hymn of praise is included on specified celebrations, not at every Mass. It is different from the Glory Be.',responses:[{label:'Everyone · Gloria',prayer:'gloria'}]},
    {id:'collect',name:'Collect',note:'After the invitation to pray, pause in silence. Listen as the priest prays the prayer for this celebration.',responses:[{label:'At the Conclusion · Everyone',text:'Amen.'}]}
  ]},
  {id:'listen',name:'We Listen',formal:'Liturgy of the Word',summary:'We hear Scripture and respond in faith.',items:[
    {id:'readings',name:'Readings & Psalm',note:'Listen to the readings. Repeat the psalm response given by the cantor; its words change with the celebration. A second reading is included when prescribed.',responses:[{label:'After Each Reading Before the Gospel · Everyone',text:'Thanks be to God.'}]},
    {id:'gospel',name:'Gospel Acclamation & Gospel',note:'Stand for the Gospel. Outside Lent, the acclamation includes Alleluia; during Lent, follow the different acclamation given by the cantor.',responses:[
      {label:'In Response to the Greeting · Everyone',text:'And with your spirit.'},
      {label:'When the Gospel Is Announced · Everyone',text:'Glory to you, O Lord.'},
      {label:'After the Gospel · Everyone',text:'Praise to you, Lord Jesus Christ.'}
    ]},
    {id:'creed',name:'Profession of Faith',note:'After the homily, a profession of faith is included when prescribed. Use the form chosen for this celebration, not every option.',options:[
      {id:'nicene',name:'Nicene Creed',responses:[{label:'Everyone · Nicene Creed',prayer:'niceneCreed'}]},
      {id:'apostles',name:'Apostles’ Creed',responses:[{label:'Everyone · Apostles’ Creed',prayer:'apostlesCreed'}]},
      {id:'baptism',name:'Renewal of Baptismal Promises',note:'At certain celebrations, questions and answers replace the creed. Listen to each question before responding.',pending:'The full questions and permitted forms are awaiting an authorized text source.',responses:[{label:'To Each Question · Everyone',text:'I do.'}]}
    ]},
    {id:'universal',name:'Universal Prayer',note:'Also called the Prayer of the Faithful. Listen to each intention, then join the response introduced by the leader. The petitions are prepared for the particular community and celebration; there is no single fixed prayer to memorize.',responses:[
      {label:'Common Response After Each Intention · Everyone',text:'Lord, hear our prayer.',note:'Your parish may use a different response or a time of silence. Follow what is announced.'},
      {label:'After the Priest’s Concluding Prayer · Everyone',text:'Amen.'}
    ]}
  ]},
  {id:'offer',name:'We Give Thanks',formal:'Liturgy of the Eucharist',summary:'The Church offers thanksgiving and prepares for Communion.',items:[
    {id:'gifts',name:'Preparation of the Gifts',note:'A song may accompany the gifts. Later, the priest invites everyone to pray and says the Prayer over the Offerings.',pending:'The longer response to the invitation to prayer is awaiting an authorized text source.',responses:[{label:'After the Prayer Over the Offerings · Everyone',text:'Amen.'}]},
    {id:'eucharist',name:'Eucharistic Prayer',note:'The priest leads this prayer of thanksgiving. Join the assembly’s responses, not the words assigned to the priest.',pending:'The full preface dialogue, Holy, Holy, Holy, and the three Mystery of Faith acclamations are awaiting an authorized text source.',responses:[{label:'At the Conclusion of the Eucharistic Prayer · Everyone',text:'Amen.'}]},
    {id:'lords-prayer',name:'The Lord’s Prayer',note:'At Mass, pause after “deliver us from evil” without adding Amen. Listen to the priest’s next prayer before joining the concluding doxology.',pending:'The concluding doxology is awaiting an authorized text source.',responses:[{label:'Everyone · Our Father at Mass',prayer:'ourFather',atMass:true}]},
    {id:'communion',name:'Peace & Communion',note:'Follow the priest and your parish’s guidance. Ask your instructor about receiving Communion before participating; enrolling in OCIA does not mean you should receive Communion.',pending:'The Lamb of God and the assembly’s response to the invitation to Communion are awaiting an authorized text source.',responses:[
      {label:'In Response to the Priest’s Greeting of Peace · Everyone',text:'And with your spirit.'},
      {label:'When Receiving Communion · The Communicant',text:'Amen.',note:'Respond to the minister before receiving.'},
      {label:'After the Prayer After Communion · Everyone',text:'Amen.'}
    ]}
  ]},
  {id:'go',name:'We Are Sent',formal:'Concluding Rites',summary:'The celebration ends with blessing and dismissal.',items:[
    {id:'blessing',name:'Blessing',note:'The words and number of responses vary with the form of blessing. Follow the priest’s cues.',options:[
      {id:'simple',name:'Simple Blessing',responses:[{label:'In Response to the Greeting · Everyone',text:'And with your spirit.'},{label:'After the Blessing · Everyone',text:'Amen.'}]},
      {id:'solemn',name:'Solemn Blessing',responses:[{label:'After Each Invocation and the Final Blessing · Everyone',text:'Amen.'}]},
      {id:'people',name:'Prayer Over the People',responses:[{label:'After the Prayer and the Final Blessing · Everyone',text:'Amen.'}]}
    ]},
    {id:'dismissal',name:'Dismissal',note:'The deacon or priest sends the assembly forth. Different dismissal formulas share the same response; a seasonal addition is used on specified days.',options:[
      {id:'ordinary',name:'Usual Dismissal',responses:[{label:'Everyone',text:'Thanks be to God.'}]},
      {id:'easter',name:'Dismissal with the Double Alleluia',note:'Use this when the dismissal includes the double Alleluia, including during the Easter Octave and on Pentecost Sunday.',responses:[{label:'Everyone',text:'Thanks be to God, alleluia, alleluia.'}]}
    ]}
  ]}
];
