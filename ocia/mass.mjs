// One continuous path transcribed from the user's St. Dominic's Missal leaflet.
// Variable readings/prayers and the leaflet's abbreviated priest prayers remain
// descriptive cues. Alternative forms are intentionally not presented as choices.
export const massSections = [
  {
    id:'gather',name:'Introductory Rites',formal:'Introductory Rites',
    summary:'Stand for the opening prayers.',
    items:[
      {id:'greeting',name:'Sign of the Cross & Greeting',when:'Regular Part',
        note:'Make the Sign of the Cross with the priest, then answer the greeting.',responses:[
          {cue:{role:'Leader · Priest',text:'In the name of the Father, and of the Son, and of the Holy Spirit.'},text:'Amen.'},
          {cue:{role:'Leader · Priest',text:'The grace of our Lord Jesus Christ, and the love of God, and the communion of the Holy Spirit be with you all.'},text:'And with your spirit.'}
        ]},
      {id:'penitential',name:'Penitential Act · I Confess',when:'Regular Part',
        note:'Join this prayer when the priest invites everyone to say I Confess.',responses:[
          {lead:'Everyone prays together:',text:'I confess to almighty God\nand to you, my brothers and sisters,\nthat I have greatly sinned,\nin my thoughts and in my words,\nin what I have done and in what I have failed to do,\n(Tap your chest.)\nthrough my fault, through my fault,\nthrough my most grievous fault;\ntherefore I ask blessed Mary ever-Virgin,\nall the Angels and Saints,\nand you, my brothers and sisters,\nto pray for me to the Lord our God.'},
          {cue:{role:'Leader · Priest',text:'May almighty God have mercy on us, forgive us our sins, and bring us to everlasting life.'},text:'Amen.'}
        ]},
      {id:'kyrie',name:'Lord, Have Mercy',when:'Regular Part',
        note:'Join these invocations as they are led or sung.',responses:[
          {text:'Lord, have mercy.\nChrist, have mercy.\nLord, have mercy.'}
        ]},
      {id:'gloria',name:'Gloria',when:'On Certain Days',
        note:'Join when the Gloria is led or sung. It is used on Sundays outside Advent and Lent, on solemnities and feasts, and at some other solemn celebrations.',responses:[
          {prayer:'gloria'}
        ]},
      {id:'collect',name:'Collect',when:'Regular Part',
        note:'Pray in silence, then listen to the priest’s opening prayer.',responses:[
          {cue:{role:'Leader · Priest',text:'Let us pray.'}},
          {lead:'At the end of the priest’s Collect prayer:',text:'Amen.'}
        ]}
    ]
  },
  {
    id:'listen',name:'Liturgy of the Word',formal:'Liturgy of the Word',
    summary:'Listen to the readings and respond at the indicated moments.',
    items:[
      {id:'readings',name:'First Reading',when:'Regular Part',
        note:'Sit and listen. The reading changes with the day.',responses:[
          {lead:'At the end of the reading:',cue:{role:'Leader · Reader',text:'The word of the Lord.'},text:'Thanks be to God.'}
        ]},
      {id:'psalm',name:'Responsorial Psalm',when:'Regular Part',
        note:'Remain seated. Repeat the response sung or spoken by the cantor; the words change with the day.',responses:[]},
      {id:'second-reading',name:'Second Reading',when:'On Certain Days',
        note:'Remain seated for the second reading on Sundays and solemnities.',responses:[
          {lead:'At the end of the reading:',cue:{role:'Leader · Reader',text:'The word of the Lord.'},text:'Thanks be to God.'}
        ]},
      {id:'gospel',name:'Gospel',when:'Regular Part',
        note:'Stand for the Gospel. Follow the acclamation led by the cantor.',responses:[
          {cue:{role:'Leader · Priest or Deacon',text:'The Lord be with you.'},text:'And with your spirit.'},
          {lead:'The priest or deacon announces the Gospel reading.',text:'Glory to you, O Lord.'},
          {lead:'At the end of the Gospel:',cue:{role:'Leader · Priest or Deacon',text:'The Gospel of the Lord.'},text:'Praise to you, Lord Jesus Christ.'}
        ]},
      {id:'homily',name:'Homily',when:'On Certain Days',
        note:'Sit and listen to the priest or deacon. The homily is required on Sundays and holy days of obligation; there is no spoken response.',responses:[]},
      {id:'creed',name:'Nicene Creed',when:'On Certain Days',
        note:'Stand and join the Creed on Sundays and solemnities. Bow during the words from “and by the Holy Spirit” through “and became man.”',responses:[
          {prayer:'niceneCreed'}
        ]},
      {id:'universal',name:'Prayer of the Faithful',when:'Regular Part',
        note:'Stand and listen to each intention. The priest concludes with a prayer; then everyone sits.',responses:[
          {lead:'After each intention and a pause for prayer:',cue:{role:'Leader · Reader',text:'Lord, in your mercy.'},text:'Hear our prayer.'}
        ]}
    ]
  },
  {
    id:'offer',name:'Liturgy of the Eucharist',formal:'Liturgy of the Eucharist',
    summary:'Follow the priest’s cues through the Eucharistic Prayer and Communion.',
    items:[
      {id:'gifts',name:'Preparation of the Gifts',when:'Regular Part',
        note:'Remain seated while the gifts are prepared. Stand when the priest invites everyone to pray.',responses:[
          {lead:'If the priest says the preparation prayers aloud, respond each time:',text:'Blessed be God for ever.'},
          {cue:{role:'Leader · Priest',text:'Pray, brothers and sisters, that my sacrifice and yours may be acceptable to God, the almighty Father.'},text:'May the Lord accept the sacrifice at your hands for the praise and glory of his name, for our good and the good of all his holy Church.'},
          {lead:'At the end of the priest’s Prayer over the Offerings:',text:'Amen.'}
        ]},
      {id:'eucharist',name:'Eucharistic Prayer · Preface Dialogue',when:'Regular Part',
        note:'Remain standing and answer each invitation.',responses:[
          {cue:{role:'Leader · Priest',text:'The Lord be with you.'},text:'And with your spirit.'},
          {cue:{role:'Leader · Priest',text:'Lift up your hearts.'},text:'We lift them up to the Lord.'},
          {cue:{role:'Leader · Priest',text:'Let us give thanks to the Lord our God.'},text:'It is right and just.'}
        ]},
      {id:'holy',name:'Holy, Holy, Holy',when:'Regular Part',
        note:'At the end of the Preface, join the priest and congregation.',responses:[
          {text:'Holy, Holy, Holy Lord God of hosts.\nHeaven and earth are full of your glory.\nHosanna in the highest.\nBlessed is he who comes in the name of the Lord.\nHosanna in the highest.'}
        ]},
      {id:'memorial',name:'Mystery of Faith',when:'Regular Part',
        note:'Listen during the Eucharistic Prayer. After the words of consecration, the priest gives this cue.',responses:[
          {cue:{role:'Leader · Priest',text:'The mystery of faith.'},text:'We proclaim your Death, O Lord,\nand profess your Resurrection\nuntil you come again.'}
        ]},
      {id:'great-amen',name:'Conclusion of the Eucharistic Prayer',when:'Regular Part',
        note:'At the conclusion of the prayer, answer Amen.',responses:[
          {cue:{role:'Leader · Priest',text:'Through him, and with him, and in him,\nO God, almighty Father,\nin the unity of the Holy Spirit,\nall glory and honor is yours,\nfor ever and ever.'},text:'Amen.'}
        ]},
      {id:'lords-prayer',name:'The Lord’s Prayer',when:'Regular Part',
        note:'Stand and pray together. Pause after “deliver us from evil”; at Mass, do not add Amen here.',responses:[
          {cue:{role:'Leader · Priest',text:'At the Savior’s command and formed by divine teaching, we dare to say:'},text:'Our Father, who art in heaven,\nhallowed be thy name;\nthy kingdom come,\nthy will be done on earth as it is in heaven.\nGive us this day our daily bread,\nand forgive us our trespasses,\nas we forgive those who trespass against us;\nand lead us not into temptation,\nbut deliver us from evil.'},
          {lead:'The priest continues with the prayer asking for deliverance. When the priest finishes:',text:'For the kingdom,\nthe power and the glory are yours\nnow and for ever.'}
        ]},
      {id:'peace',name:'Sign of Peace',when:'Regular Part',
        note:'Listen to the prayer for peace. Exchange a sign of peace when invited.',responses:[
          {lead:'At the end of the priest’s prayer to Jesus Christ for peace:',text:'Amen.'},
          {cue:{role:'Leader · Priest',text:'The peace of the Lord be with you always.'},text:'And with your spirit.'},
          {cue:{role:'Leader · Priest or Deacon',text:'Let us offer each other the sign of peace.'}}
        ]},
      {id:'lamb',name:'Lamb of God',when:'Regular Part',
        note:'Join as the bread is broken.',responses:[
          {text:'Lamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, have mercy on us.\nLamb of God, you take away the sins of the world, grant us peace.'}
        ]},
      {id:'invitation',name:'Invitation to Communion',when:'Regular Part',
        note:'Kneel. The priest raises the host; everyone joins the response.',responses:[
          {cue:{role:'Leader · Priest',text:'Behold the Lamb of God,\nbehold him who takes away the sins of the world.\nBlessed are those called to the supper of the Lamb.'},text:'Lord, I am not worthy\nthat you should enter under my roof,\nbut only say the word\nand my soul shall be healed.'}
        ]},
      {id:'communion',name:'Communion',when:'For Those Receiving',
        note:'If you are receiving Communion, come forward and bow your head before receiving. This spoken response is only for the person receiving.',responses:[
          {cue:{role:'Leader · Minister',text:'The Body of Christ.'},role:'Response · Communicants Only',text:'Amen.'}
        ]},
      {id:'after-communion',name:'Prayer After Communion',when:'Regular Part',
        note:'After a period of silence, stand for the prayer.',responses:[
          {cue:{role:'Leader · Priest',text:'Let us pray.'}},
          {lead:'At the end of the priest’s Prayer after Communion:',text:'Amen.'}
        ]}
    ]
  },
  {
    id:'go',name:'Concluding Rites',formal:'Concluding Rites',
    summary:'Remain standing for the blessing and dismissal.',
    items:[
      {id:'blessing',name:'Blessing',when:'Regular Part',
        note:'Make the Sign of the Cross as the priest blesses everyone.',responses:[
          {cue:{role:'Leader · Priest',text:'The Lord be with you.'},text:'And with your spirit.'},
          {cue:{role:'Leader · Priest',text:'May almighty God bless you, the Father, and the Son, and the Holy Spirit.'},text:'Amen.'}
        ]},
      {id:'dismissal',name:'Dismissal',when:'Regular Part',
        note:'Answer the dismissal.',responses:[
          {cue:{role:'Leader · Priest or Deacon',text:'Go forth, the Mass is ended.'},text:'Thanks be to God.'}
        ]}
    ]
  }
];
