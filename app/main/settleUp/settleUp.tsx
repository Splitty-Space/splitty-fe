import {Friend} from "@/entities";
import {Avatar, Caption, Cell, Divider, List, Title} from "@telegram-apps/telegram-ui";
import Header from "@/app/main/header/header";
import Logo from "@/app/main/header/logo";
import {useTranslation} from "react-i18next";
import {subPageConst} from "@/const/subPageConst";

export default function SettleUp({friends, setSubpage, setSettleUpPaymentInfo}: {
    friends: Friend[],
    setSubpage: Function,
    setSettleUpPaymentInfo: Function
}) {
    const {t} = useTranslation();

    const onSettleUpPayment = (friend: Friend, currency: string) => () => {
        setSettleUpPaymentInfo({friend, currency});
        setSubpage(subPageConst.SettleUpPayment);
    };

    return (
        <>
            <Header
                CentralComponent={Logo}
                subHeaderClassName="justify-content-center mt-6"
                AfterComponent={<Title className="mt-8 flex justify-content-center">{t("settleUp.SettleUp")}</Title>}
            />

            <List className="my-8 px-0">
                {friends?.map((friend) =>
                    friend.total.map(({amount, currency}) =>
                        <div key={friend.id + currency}>
                            <Cell
                                className="friends-list_shrink-0"
                                before={<Avatar size={48} src={friend.photo_url}/>}
                                after={
                                    <div className="flex flex-col">
                                        <Caption
                                            weight="3"
                                            className={Number(amount) > 0 ? "blue" : "red"}>
                                            {`${Number(amount) > 0 ? "owes you" : "you owe"} ${Math.abs(Number(amount))} ${currency}`}
                                        </Caption>
                                    </div>}
                                onClick={onSettleUpPayment(friend, currency)}
                            >
                                {friend.name}
                            </Cell>
                            <Divider className="ml-20 border-2"/>
                        </div>))}
            </List>
        </>);
}