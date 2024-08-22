import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
    // detect user language
    // learn more: https://github.com/i18next/i18next-browser-languageDetector
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    // for all options read: https://www.i18next.com/overview/configuration-options
    .init({
        debug: true,
        fallbackLng: "en",
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: {
                translation: {
                    header: {
                        Search: "Search",
                    },
                    footer: {
                        Friends: "Friends",
                        Groups: "Groups",
                        Activity: "Activity",
                        Account: "Account",
                    },
                    friendsList: {
                        AddFirstFriend: "Add you first friend to your friends list",
                        FriendNotFound: "Friend not found"
                    },
                    friend: {
                        SettleUp: "Settle up",
                        AddFirstExpense: "Add first expense"
                    },
                    addFriends: {
                        Search: "Search for a user",
                        NoResults: "No results",
                    },
                    addGroup: {
                        Next: "Next",
                        Prev: "Prev",
                        GroupName: "GROUP NAME",
                        EnterGroupName: "Enter group name",
                        GroupType: "GROUP TYPE",
                        SelectGroupType: "Select Group Type",
                        GroupKinds: {
                            TRIP: "trip",
                            FRIENDS: "friends",
                            HOME: "home",
                            BUSINESS: "business",
                            COUPLE: "couple",
                            OTHER: "other"
                        }
                    },
                    account: {
                        ContactUs: "Contact Us",
                        DefaultCurrency: "Default Currency",
                        Language: "Language"
                    }
                }
            },
            ru: {
                translation: {
                    header: {
                        Search: "Поиск",
                    },
                    footer: {
                        Friends: "Друзья",
                        Groups: "Группы",
                        Activity: "Активность",
                        Account: "Аккаунт",
                    },
                    friendsList: {
                        AddFirstFriend: "Добавьте своего первого друга в список друзей",
                        FriendNotFound: "Друг не найден"
                    },
                    friend: {
                        SettleUp: "Рассчитаться"
                    },
                    addFriends: {
                        Search: "Поиск пользователя",
                        NoResults: "Нет результатов",
                    },
                    addGroup: {
                        Next: "Далее",
                        Prev: "Назад",
                        GroupName: "НАЗВАНИЕ ГРУППЫ",
                        EnterGroupName: "Введите название группы",
                        GroupType: "ТИП ГРУППЫ",
                        SelectGroupType: "Выберите тип группы",
                        GroupKinds: {
                            TRIP: "путешествие",
                            FRIENDS: "друзья",
                            HOME: "дом",
                            BUSINESS: "бизнес",
                            COUPLE: "пара",
                            OTHER: "другие"
                        }
                    },
                    account: {
                        ContactUs: "Связаться с нами",
                        DefaultCurrency: "Валюта по умолчанию",
                        Language: "Язык"
                    }
                }
            },
            ua: {
                translation: {
                    header: {
                        Search: "Пошук",
                    },
                    footer: {
                        Friends: "Друзі",
                        Groups: "Групи",
                        Activity: "Активність",
                        Account: "Акаунт",
                    },
                    friendsList: {
                        AddFirstFriend: "Додайте свого першого друга до списку друзів",
                        FriendNotFound: "Друга не знайдено"
                    },
                    friend: {
                        SettleUp: "Розраховуватися"
                    },
                    addFriends: {
                        Search: "Пошук користувача",
                        NoResults: "Результатів немає",
                    },
                    addGroup: {
                        Next: "Далі",
                        Prev: "Назад",
                        GroupName: "НАЗВА ГРУПИ",
                        EnterGroupName: "Введіть назву групи",
                        GroupType: "ТИП ГРУПИ",
                        SelectGroupType: "Виберіть тип групи",
                        GroupKinds: {
                            TRIP: "подорож",
                            FRIENDS: "друзі",
                            HOME: "будинок",
                            BUSINESS: "бізнес",
                            COUPLE: "пара",
                            OTHER: "інші"
                        }
                    },
                    account: {
                        ContactUs: "Зв'язатися з нами",
                        DefaultCurrency: "Валюта",
                        Language: "Мова"
                    }
                }
            }
        }
    });

export default i18n;