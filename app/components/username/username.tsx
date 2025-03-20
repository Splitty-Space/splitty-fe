import React, {memo} from "react";
import classNames from "classnames";

interface UsernameProps {
    username: string
}

const Username: React.FC<UsernameProps> = memo(({username}) => {
    return (<span className={classNames("text-ellipsis overflow-hidden", {
        "invisible": !username
    })}>
        {"@" + username}
    </span>);
});

Username.displayName = "username";

export default Username;