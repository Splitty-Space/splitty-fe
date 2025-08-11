import React from "react";

const handleInputFocus = (delay = 1000) => {
    return (event: React.ChangeEvent<HTMLInputElement>) => setTimeout(() => {
        event.target.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "nearest"
        });
    }, delay);
};

export default handleInputFocus;
