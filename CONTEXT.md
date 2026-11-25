# Splitty

Splitty is a Telegram mini app for sharing expenses with friends: who paid for what, who owes whom, and settling up.

## Language

### Access

**Launch**:
One opening of Splitty from Telegram, from a bot button, a link or the menu. Reloading the page inside it does not start a new Launch.
_Avoid_: Start, open, visit

**Session**:
The time during which Splitty knows who the user is and can load their data. It begins when Telegram's signed launch data is accepted.
_Avoid_: Login, auth (when meaning this state)

### Friends

**Friend**:
Another Splitty user from your friends list, with whom you share Expenses and settle up.
_Avoid_: User, contact

### Expenses

**Expense**:
A purchase shared by two or more Participants, with a total amount in one currency, a record of who paid and a record of who owes.
_Avoid_: Bill, transaction

**Participant**:
A person taking part in an Expense, either as someone who paid, someone who owes, or both.
_Avoid_: Member, user (when meaning a person in an Expense)

**Paid by**:
The side of an Expense that records how much each Participant actually paid.
_Avoid_: Payers, lent

**Split**:
The side of an Expense that records how much of the total each Participant owes.
_Avoid_: Debtors, debt, split between

**Allocation**:
One Participant's amount on one side of an Expense, either in Paid by or in Split. Each side's Allocations must add up to the Expense total.
_Avoid_: Payment, share (when meaning a single line)

**Expense draft**:
An Expense being created or edited that has not been saved yet.
_Avoid_: Form state

### Settling up

**Settlement**:
An Expense that records one Participant paying another back, rather than a shared purchase.
_Avoid_: Payment, settle-up payment

### Activity

**Activity**:
A record that someone created, edited or deleted an Expense or a Settlement.
_Avoid_: Event, log entry

**Activity feed**:
The list of Activity on all Expenses and Settlements the user takes part in, newest first.
_Avoid_: Activity page, history

**Expense history**:
The Activity of one Expense or Settlement, shown on its details.
_Avoid_: Log, audit

### Tutorial

**Tutorial**:
The guided walkthrough of the app, shown on every visit until the user finishes or closes it once. It adds the Tutorial friend and creates a Tutorial expense with them.
_Avoid_: Tour, guide, onboarding

**Tutorial friend**:
The fixed Splitty account that the Tutorial adds as a Friend, so the user has someone to share the Tutorial expense with.
_Avoid_: Test friend

**Tutorial expense**:
The Expense with the Tutorial friend that the Tutorial walks the user through. Until the Tutorial saves it, it exists only on the user's device.
_Avoid_: Test expense, sample expense
