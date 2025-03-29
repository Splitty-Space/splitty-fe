import React, {memo} from "react";
import classNames from "classnames";
import {useUserPhoto} from "@/utils/useUserPhoto";
import {Avatar as Avatar_} from "@telegram-apps/telegram-ui";
import "./avatar.css";

interface AvatarProps {
    user_id?: number;
    size?: 20 | 24 | 28 | 40 | 48 | 96;
    style?: React.CSSProperties;
    className?: string;
    isSelected?: boolean;
}

const Avatar: React.FC<AvatarProps> = memo(({
                                                user_id,
                                                size = 40,
                                                style,
                                                className,
                                                isSelected
                                            }) => {
    const {photoUrl} = useUserPhoto(user_id);

    return <Avatar_
        size={size}
        src={photoUrl}
        alt={`User photo - ${user_id}`}
        style={style}
        className={classNames("avatar", {
            "avatar__selected": isSelected
        }, className)}
    />;
});

Avatar.displayName = "Avatar";

export default Avatar;