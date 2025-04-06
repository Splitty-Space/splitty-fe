import React from "react";
import {useTranslation} from "react-i18next";
import {Cell, Divider} from "@telegram-apps/telegram-ui";
import {formatDateTime} from "@/utils/formatDateTime";
import Avatar from "@/app/components/avatar/Avatar";
import {Me} from "@/services/useMe";
import "./skeletonCell.css";

const SkeletonCell = ({key, style, me}: { key: string, style: object, me: Me }) => {
    const {t} = useTranslation();

    return (
        <div key={key} style={style}>
            <Cell
                className="blur-block"
                subtitle={formatDateTime("2025-04-05T23:11:18.682875", me.language)}
                before={<Avatar size={48} user_id={me?.id}/>}
            >
                {`${t("settleUp.YouPaid")} ${me.name} some money`}
            </Cell>
            <Divider className="ml-20 border-2"/>
        </div>
    );
};

export default SkeletonCell;