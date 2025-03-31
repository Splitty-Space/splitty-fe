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
                        You: "You",
                        you: "you",
                    },
                    friendSettings: {
                        ConfirmDelete: "Confirm Delete",
                        ConfirmMessage: "Are you sure you want to delete this friend?",
                        DeleteButton: "Delete",
                        CancelButton: "Cancel",
                        FriendDeleted: "Friend deleted"
                    },
                    addFriends: {
                        Search: "Search for a user",
                        NoResults: "No results",
                    },
                    settleUp: {
                        SettleUp: "Settle Up",
                        PaymentInfo: "Payment Info",
                        YouPaid: "You paid",
                        PaidYou: "paid you",
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
                        EditAnExpense: "Edit an Expense",
                        Next: "Next",
                        Prev: "Prev",
                        Friends: "Friends",
                        Groups: "Groups",
                        Save: "Save",
                        ExpenseName: "Expense Name",
                        MoneySpent: "Money Spent",
                        Currency: "Currency",
                        DateAndTime: "Date and Time",
                        FullyPaidByYou: "Fully paid by you",
                        SplitEquallyBetweenAll: "Split equally between all",
                        Split: "Split",
                        PaidBy: "Paid by",
                        Of: "of",
                        Filled: "filled",
                        Left: "left",
                    },
                    expenseDetails: {
                        ConfirmMessage: "Are you sure you want to delete this expense?",
                        ExpenseCreated: "Expense created",
                        ExpenseUpdated: "Expense updated",
                        ExpenseDeleted: "Expense deleted",
                        CantShowDeletedExpense: "Can't show deleted expense!",
                        people: "people",
                        borrowed: "borrowed",
                        paidForYourself: "paid for him/herself",
                        Expense: "Expense",
                        Payment: "Payment",
                        wasEditedBy: "was edited by",
                        expenseHistory: "EXPENSE HISTORY",
                        detailedChanges: "DETAILED CHANGES",
                        changed: "changed",
                        debtAmount: "debt amount",
                        lentAmount: "lent amount",
                        from: "from",
                        to: "to"
                    },
                    activity: {
                        NoActivityYet: "No activity yet",
                        created: "created",
                        deleted: "deleted",
                        edited: "edited",
                    },
                    account: {
                        DefaultCurrency: "Default Currency",
                        Language: "Language",
                        ContactUs: "Contact Us",
                        ReportABug: "Report a Bug",
                        ProposeChanges: "Propose Changes",
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
                        You: "Ты",
                        you: "тебе",
                    },
                    friendSettings: {
                        ConfirmDelete: "Подтвердите удаление",
                        ConfirmMessage: "Вы уверены, что хотите удалить этого друга?",
                        DeleteButton: "Удалить",
                        CancelButton: "Отмена",
                        FriendDeleted: "Друг удалён",
                    },
                    addFriends: {
                        Search: "Поиск пользователя",
                        NoResults: "Нет результатов",
                    },
                    settleUp: {
                        SettleUp: "Рассчитаться",
                        PaymentInfo: "Платежная информация",
                        YouPaid: "Вы заплатили",
                        PaidYou: "заплатил вам",
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
                        EditAnExpense: "Редактировать расход",
                        Next: "Далее",
                        Prev: "Назад",
                        Friends: "Друзья",
                        Groups: "Группы",
                        Save: "Сохранить",
                        ExpenseName: "Название расхода",
                        MoneySpent: "Потраченные деньги",
                        Currency: "Валюта",
                        DateAndTime: "Дата и время",
                        FullyPaidByYou: "Оплачено мной",
                        SplitEquallyBetweenAll: "Разделить поровну между всеми",
                        Split: "Разделить",
                        PaidBy: "Заплатил",
                        Of: "из",
                        Filled: "заполнено",
                        Left: "осталось",
                    },
                    expenseDetails: {
                        ConfirmMessage: "Вы уверены, что хотите удалить этот расход?",
                        ExpenseCreated: "Расход создан",
                        ExpenseUpdated: "Расход обновлен",
                        ExpenseDeleted: "Расход удалён",
                        CantShowDeletedExpense: "Невозможно показать удаленный расход!",
                        people: "людей",
                        borrowed: "одолжил",
                        paidForYourself: "заплатил за себя",
                        Expense: "Расход",
                        Payment: "Оплата",
                        wasEditedBy: "был изменён",
                        expenseHistory: "ИСТОРИЯ РАСХОДОВ",
                        detailedChanges: "ПОДРОБНЫЕ ИЗМЕНЕНИЯ",
                        changed: "изменен",
                        debtAmount: "сумма долга",
                        lentAmount: "одолженная сумма",
                        from: "с",
                        to: "на"
                    },
                    activity: {
                        NoActivityYet: "Пока нет активностей",
                        created: "создал",
                        deleted: "удалил",
                        edited: "отредактировал",
                    },
                    account: {
                        DefaultCurrency: "Валюта по умолчанию",
                        Language: "Язык",
                        ContactUs: "Связаться с нами",
                        ReportABug: "Сообщить об ошибке",
                        ProposeChanges: "Предложить изменения",
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
                        You: "Ти",
                        you: "тобі",
                    },
                    friendSettings: {
                        ConfirmDelete: "Підтвердьте видалення",
                        ConfirmMessage: "Ви впевнені, що хочете видалити цього друга?",
                        DeleteButton: "Видалити",
                        CancelButton: "Скасувати",
                        FriendDeleted: "Друг видаляється"
                    },
                    addFriends: {
                        Search: "Пошук користувача",
                        NoResults: "Результатів немає",
                    },
                    settleUp: {
                        SettleUp: "Розраховуватися",
                        PaymentInfo: "Платіжна інформація",
                        YouPaid: "Ви заплатили",
                        PaidYou: "заплатив вам",
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
                        EditAnExpense: "Редагувати витрати",
                        Next: "Далі",
                        Prev: "Назад",
                        Friends: "Друзі",
                        Groups: "Групи",
                        Save: "Зберегти",
                        ExpenseName: "Назва витрат",
                        MoneySpent: "Витрачені гроші",
                        Currency: "Валюта",
                        DateAndTime: "Дата та час",
                        FullyPaidByYou: "Сплачено мною",
                        SplitEquallyBetweenAll: "Розділити порівну між усіма",
                        Split: "Розподіляти",
                        PaidBy: "Оплачений",
                        Of: "з",
                        Filled: "наповнений",
                        Left: "лівий",
                    },
                    expenseDetails: {
                        ConfirmMessage: "Ви впевнені, що хочете видалити цей рахунок?",
                        ExpenseCreated: "Витрати створені",
                        ExpenseUpdated: "Витрати оновлені",
                        ExpenseDeleted: "Споживання видаляється",
                        CantShowDeletedExpense: "Неможливо показати видалену витрату!",
                        people: "людей",
                        borrowed: "позичив",
                        paidForYourself: "заплатив за себе",
                        Expense: "Витрата",
                        Payment: "Оплата",
                        wasEditedBy: "був змінений",
                        expenseHistory: "ІСТОРІЯ ВИТРАТ",
                        detailedChanges: "ДЕТАЛЬНІ ЗМІНИ",
                        changed: "змінено",
                        debtAmount: "сума боргу",
                        lentAmount: "позичена сума",
                        from: "з",
                        to: "на"
                    },
                    activity: {
                        NoActivityYet: "Поки що немає активностей",
                        created: "створив",
                        deleted: "видалив",
                        edited: "відредагував",
                    },
                    account: {
                        DefaultCurrency: "Валюта",
                        Language: "Мова",
                        ContactUs: "Зв'язатися з нами",
                        ReportABug: "Повідомити про помилку",
                        ProposeChanges: "Запропонувати зміни",
                    }
                }
            }
        }
    });

export default i18n;