
import fetch from 'node-fetch';


export async function fetchFromItsoftActual(innOrOgrnKey) {
  const safeInnOrOgrnKey = getSafeDigitsString(innOrOgrnKey);
  const response = await fetch(`https://egrul.itsoft.ru/${safeInnOrOgrnKey}.json`);
  const entry = await response.json();
  return entry;
}

function getSafeDigitsString(input) {
  if (typeof input === 'number') { input = Math.floor(input) };
  const safeDigitsString = input.toString().replace(/\D/g,'');
  return safeDigitsString;
}

export async function fetchFromItsoft(innOrOgrnKey) {
  if (innOrOgrnKey == '246004351629') {
    return fetchFromItsoftFake();
  } else {
    return await fetchFromItsoftActual(innOrOgrnKey);
  }
}

function fetchFromItsoftFake() {
  const fakeData = "2022-12-"+Math.floor(10+Math.random()*20);
  const fakeEntry = 
    {
      "@attributes": {
        "ДатаВыг": fakeData,
        "zip_file": "EGRIP_405/04.04.2022/EGRIP_2022-04-04_1.zip",
        "xml_file": "EGRIP_2022-04-04_867405.XML"
      },
      "СвИП": {
        "@attributes": {
          "ДатаВып": fakeData,
          "ОГРНИП": "319246800150991",
          "ДатаОГРНИП": "2019-12-18",
          "ИННФЛ": "246004351629",
          "КодВидИП": "1",
          "НаимВидИП": "Индивидуальный предприниматель"
        },
        "СвФЛ": {
          "@attributes": {
            "Пол": "1"
          },
          "ФИОРус": {
            "@attributes": {
              "Фамилия": (Math.random() > 0.5) ? "БАРКАЛОВ" : "AБРАЛОВ",
              "Имя": (Math.random() > 0.5) ? "КОНСТАНТИН" : "БОНСТАНТИН",
              "Отчество": (Math.random() > 0.5) ? "ЛЕОНИДОВИЧ" : "КОЛЕНОНИДОВИЧ"
            }
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "319246800150991",
              "ДатаЗаписи": "2019-12-18"
            }
          }
        },
        "СвГражд": {
          "@attributes": {
            "ВидГражд": "1"
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "319246800150991",
              "ДатаЗаписи": "2019-12-18"
            }
          }
        },
        "СвРегИП": {
          "@attributes": {
            "ОГРНИП": "319246800150991",
            "ДатаОГРНИП": "2019-12-18"
          }
        },
        "СвРегОрг": {
          "@attributes": {
            "КодНО": "2468",
            "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю",
            "АдрРО": ",660133,,,Красноярск г,,Партизана Железняка ул,46,,"
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "319246800150991",
              "ДатаЗаписи": "2019-12-18"
            }
          }
        },
        "СвПрекращ": {
          "СвСтатус": {
            "@attributes": {
              "КодСтатус": "201",
              "НаимСтатус": "Индивидуальный предприниматель прекратил деятельность в связи с принятием им соответствующего решения",
              "ДатаПрекращ":fakeData
            }
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "422246800232760",
              "ДатаЗаписи":fakeData
            }
          }
        },
        "СвУчетНО": {
          "@attributes": {
            "ИННФЛ": "246004351629",
            "ДатаПостУч": "2019-12-18"
          },
          "СвНО": {
            "@attributes": {
              "КодНО": "2465",
              "НаимНО": "Инспекция Федеральной налоговой службы по Советскому району г.Красноярска"
            }
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "422246800232771",
              "ДатаЗаписи":fakeData
            }
          }
        },
        "СвРегПФ": {
          "@attributes": {
            "РегНомПФ": "034008110196",
            "ДатаРег": "2019-12-24"
          },
          "СвОргПФ": {
            "@attributes": {
              "КодПФ": "034008",
              "НаимПФ": "Государственное учреждение - Управление Пенсионного фонда Российской Федерации в Советском районе г. Красноярска"
            }
          },
          "ГРНИПДата": {
            "@attributes": {
              "ГРНИП": "419246800928031",
              "ДатаЗаписи": "2019-12-25"
            }
          }
        },
        "СвОКВЭД": {
          "СвОКВЭДОсн": {
            "@attributes": {
              "КодОКВЭД": "62.01",
              "НаимОКВЭД": "Разработка компьютерного программного обеспечения",
              "ПрВерсОКВЭД": "2014"
            },
            "ГРНИПДата": {
              "@attributes": {
                "ГРНИП": "319246800150991",
                "ДатаЗаписи": "2019-12-18"
              }
            }
          },
          "СвОКВЭДДоп": [
            {
              "@attributes": {
                "КодОКВЭД": "46.51",
                "НаимОКВЭД": "Торговля оптовая компьютерами, периферийными устройствами к компьютерам и программным обеспечением",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "46.52",
                "НаимОКВЭД": "Торговля оптовая электронным и телекоммуникационным оборудованием и его запасными частями",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "47.41",
                "НаимОКВЭД": "Торговля розничная компьютерами, периферийными устройствами к ним и программным обеспечением в специализированных магазинах",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "47.91",
                "НаимОКВЭД": "Торговля розничная по почте или по информационно-коммуникационной сети Интернет",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "55.20",
                "НаимОКВЭД": "Деятельность по предоставлению мест для краткосрочного проживания",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "62.02",
                "НаимОКВЭД": "Деятельность консультативная и работы в области компьютерных технологий",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "62.03",
                "НаимОКВЭД": "Деятельность по управлению компьютерным оборудованием",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "62.09",
                "НаимОКВЭД": "Деятельность, связанная с использованием вычислительной техники и информационных технологий, прочая",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "68.20.1",
                "НаимОКВЭД": "Аренда и управление собственным или арендованным жилым недвижимым имуществом",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "68.20.2",
                "НаимОКВЭД": "Аренда и управление собственным или арендованным нежилым недвижимым имуществом",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "95.11",
                "НаимОКВЭД": "Ремонт компьютеров и периферийного компьютерного оборудования",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "95.12",
                "НаимОКВЭД": "Ремонт коммуникационного оборудования",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            },
            {
              "@attributes": {
                "КодОКВЭД": "95.21",
                "НаимОКВЭД": "Ремонт электронной бытовой техники",
                "ПрВерсОКВЭД": "2014"
              },
              "ГРНИПДата": {
                "@attributes": {
                  "ГРНИП": "319246800150991",
                  "ДатаЗаписи": "2019-12-18"
                }
              }
            }
          ]
        },
        "СвЗапЕГРИП": [
          {
            "@attributes": {
              "ИдЗап": "150000189061043",
              "ГРНИП": "319246800150991",
              "ДатаЗап": "2019-12-18"
            },
            "ВидЗап": {
              "@attributes": {
                "КодСПВЗ": "21211",
                "НаимВидЗап": "Государственная регистрация физического лица в качестве индивидуального предпринимателя"
              }
            },
            "СвРегОрг": {
              "@attributes": {
                "КодНО": "2468",
                "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю"
              }
            },
            "СведПредДок": [
              {
                "НаимДок": "Р21001 ЗАЯВЛЕНИЕ О РЕГИСТРАЦИИ ФЛ В КАЧЕСТВЕ ИП"
              },
              {
                "НаимДок": "ДОКУМЕНТ ОБ ОПЛАТЕ ГОСУДАРСТВЕННОЙ ПОШЛИНЫ",
                "НомДок": "Б/Н",
                "ДатаДок": "2019-12-12"
              },
              {
                "НаимДок": "ДОКУМЕНТ, УДОСТОВЕРЯЮЩИЙ ЛИЧНОСТЬ ГРАЖДАНИНА РФ"
              }
            ]
          },
          {
            "@attributes": {
              "ИдЗап": "150000189262782",
              "ГРНИП": "419246800910005",
              "ДатаЗап": "2019-12-18"
            },
            "ВидЗап": {
              "@attributes": {
                "КодСПВЗ": "23200",
                "НаимВидЗап": "Представление сведений об учете в налоговом органе"
              }
            },
            "СвРегОрг": {
              "@attributes": {
                "КодНО": "2468",
                "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю"
              }
            }
          },
          {
            "@attributes": {
              "ИдЗап": "150000189652412",
              "ГРНИП": "419246800928031",
              "ДатаЗап": "2019-12-25"
            },
            "ВидЗап": {
              "@attributes": {
                "КодСПВЗ": "23300",
                "НаимВидЗап": "Представление сведений о регистрации в качестве страхователя в территориальном органе Пенсионного фонда Российской Федерации"
              }
            },
            "СвРегОрг": {
              "@attributes": {
                "КодНО": "2468",
                "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю"
              }
            }
          },
          {
            "@attributes": {
              "ИдЗап": "150000249526327",
              "ГРНИП": "422246800232760",
              "ДатаЗап":fakeData
            },
            "ВидЗап": {
              "@attributes": {
                "КодСПВЗ": "24111",
                "НаимВидЗап": "Прекращение физическим лицом деятельности в качестве индивидуального предпринимателя"
              }
            },
            "СвРегОрг": {
              "@attributes": {
                "КодНО": "2468",
                "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю"
              }
            },
            "СведПредДок": {
              "НаимДок": "Р26001 Заявление о прекращении деятельности ИП"
            }
          },
          {
            "@attributes": {
              "ИдЗап": "150000255289260",
              "ГРНИП": "422246800232771",
              "ДатаЗап":fakeData
            },
            "ВидЗап": {
              "@attributes": {
                "КодСПВЗ": "23200",
                "НаимВидЗап": "Представление сведений об учете в налоговом органе"
              }
            },
            "СвРегОрг": {
              "@attributes": {
                "КодНО": "2468",
                "НаимНО": "Межрайонная инспекция Федеральной налоговой службы № 23 по Красноярскому краю"
              }
            }
          }
        ]
      }
    };
    if (Math.random() > 0.5) { delete fakeEntry['СвИП']['СвПрекращ']; }
    return fakeEntry;
};