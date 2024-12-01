import {Modal} from "@telegram-apps/telegram-ui";
import {
    ModalHeader
} from "@telegram-apps/telegram-ui/dist/components/Overlays/Modal/components/ModalHeader/ModalHeader";

export const expenseHistory = () => {
    <Modal
        header={<ModalHeader>Only iOS header</ModalHeader>}
        trigger={<Button size="m">Open modal</Button>}
    >
    </Modal>
};