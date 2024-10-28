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
                    friendPage: {
                        YouBorrowed: "You borrowed",
                        OwesYou: "owes you",
                        YouOwe: "you owe",
                        Paid: "paid",
                        YouLent: "You lent",
                    },
                    friendSettings: {
                        ConfirmDelete: "Confirm Delete",
                        ConfirmMessage: "Are you sure you want to delete this friend?",
                        DeleteButton: "Delete",
                        CancelButton: "Cancel",
                    },
                    addFriends: {
                        Search: "Search for a user",
                        NoResults: "No results",
                    },
                    settleUp: {
                        SettleUp: "Settle Up",
                        PaymentInfo: "Payment Info",
                        YouPaid: "YOU PAID",
                        PaidYou: "PAID YOU",
                        Save: "Save",
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
                    expenses: {
                        AddAnExpense: "Add an Expense",
                        Next: "Next",
                        Prev: "Prev",
                        Friends: "Friends",
                        Groups: "Groups",
                        Save: "Save",
                        ExpenseName: "Expense Name",
                        MoneySpent: "Money Spent",
                        Currency: "Currency",
                        Date: "Date",
                        FullyPaidByYou: "Fully paid by you",
                        SplitEquallyBetweenAll: "Split equally between all",
                        Split: "Split",
                        PaidBy: "Paid by"
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
                    friendPage: {
                        YouBorrowed: "Вы одолжили",
                        OwesYou: "должны тебе",
                        YouOwe: "ты должен",
                        Paid: "заплатил",
                        YouLent: "Вы одолжили",
                    },
                    friendSettings: {
                        ConfirmDelete: "Подтвердить удаление",
                        ConfirmMessage: "Вы уверены, что хотите удалить этого друга?",
                        DeleteButton: "Удалить",
                        CancelButton: "Отмена",
                    },
                    addFriends: {
                        Search: "Поиск пользователя",
                        NoResults: "Нет результатов",
                    },
                    settleUp: {
                        SettleUp: "Рассчитаться",
                        PaymentInfo: "Платежная информация",
                        YouPaid: "ВЫ ЗАПЛАТИЛИ",
                        PaidYou: "ЗАПЛАТИЛ ВАМ",
                        Save: "Сохранить",
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
                    expenses: {
                        AddAnExpense: "Добавить расход",
                        Next: "Далее",
                        Prev: "Назад",
                        Friends: "Друзья",
                        Groups: "Группы",
                        Save: "Сохранить",
                        ExpenseName: "Название расхода",
                        MoneySpent: "Потраченные деньги",
                        Currency: "Валюта",
                        Date: "Дата",
                        FullyPaidByYou: "Полностью оплачено вами",
                        SplitEquallyBetweenAll: "Разделить поровну между всеми"
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
                    friendPage: {
                        YouBorrowed: "Ви позичили",
                        OwesYou: "винен тобі",
                        YouOwe: "ти винен",
                        Paid: "заплатив",
                        YouLent: "Ви позичили",
                    },
                    friendSettings: {
                        ConfirmDelete: "Підтвердьте видалення",
                        ConfirmMessage: "Ви впевнені, що хочете видалити цього друга?",
                        DeleteButton: "Видалити",
                        CancelButton: "Скасувати",
                    },
                    addFriends: {
                        Search: "Пошук користувача",
                        NoResults: "Результатів немає",
                    },
                    settleUp: {
                        SettleUp: "Розраховуватися",
                        PaymentInfo: "Платіжна інформація",
                        YouPaid: "ВИ ЗАПЛАТИЛИ",
                        PaidYou: "ЗАПЛАТИВ ВАМ",
                        Save: "Зберегти",
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
                    expenses: {
                        AddAnExpense: "Додайте витрати",
                        Next: "Далі",
                        Prev: "Назад",
                        Friends: "Друзі",
                        Groups: "Групи",
                        Save: "Зберегти",
                        ExpenseName: "Назва витрат",
                        MoneySpent: "Витрачені гроші",
                        Currency: "Валюта",
                        Date: "Дата",
                        FullyPaidByYou: "Повністю оплачено вами",
                        SplitEquallyBetweenAll: "Розділити порівну між усіма"
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