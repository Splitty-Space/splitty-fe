export const ExpenseNameInputId = "ExpenseNameInputId";

export const focusOnExpenseNameInput = () => {
    const maxAttempts = 100;
    let attempts = 0;

    function focusAttempt() {
        const input = document.getElementById(ExpenseNameInputId);
        if (input) {
            input.focus();
        } else if (attempts < maxAttempts) {
            attempts++;
            setTimeout(focusAttempt, 100);
        }
    }

    setTimeout(focusAttempt, 100);
};