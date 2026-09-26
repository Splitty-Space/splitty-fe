import classNames from "classnames";
import {useTranslation} from "react-i18next";
import {Caption, Cell, Divider} from "@telegram-apps/telegram-ui";
import type {CSSProperties} from "react";
import type {Friend} from "@/entities";
import Avatar from "@/app/components/avatar/Avatar";
import Username from "@/app/components/username/username";
import compactNumber from "@/utils/compactNumber";

export default function FriendRow({friend, style, onSelect}: {
    friend: Friend;
    style: CSSProperties;
    onSelect: (id: number) => void;
}) {
    const {t} = useTranslation();

    return (
        <div id={`friend_${friend.id}`} style={style}>
            <Cell
                className="friends-list_shrink-0"
                before={<Avatar size={48} user_id={friend.id}/>}
                subtitle={<Username username={friend.username}/>}
                after={<div className="flex flex-col items-end max-w-full">
                    {friend.total.slice(0, 2).map(({amount, currency}, index) => {
                        const balance = Number(amount);
                        return (
                            <Caption
                                key={`${currency}-${index}`}
                                weight="3"
                                className={classNames("max-w-full text-ellipsis overflow-hidden", {
                                    "blue": balance > 0,
                                    "red": balance < 0,
                                })}
                            >
                                {balance === 0
                                    ? `0 ${currency}`
                                    : `${t(balance > 0 ? "friendPage.OwesYou" : "friendPage.YouOwe")} ${compactNumber(Math.abs(balance))} ${currency}`}
                            </Caption>
                        );
                    })}
                </div>}
                onClick={() => onSelect(friend.id)}
            >
                {friend.name}
            </Cell>
            <Divider className="ml-20 border-2"/>
        </div>
    );
}
