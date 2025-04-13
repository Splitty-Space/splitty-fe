import {useRef, useState, useEffect, useLayoutEffect} from "react";

const useContentHeight = (): [React.RefObject<HTMLDivElement>, number] => {
    const refContainer = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        if (refContainer.current) {
            const computedStyle = window.getComputedStyle(refContainer.current);

            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);

            const calculatedHeight = refContainer.current.clientHeight - paddingTop - paddingBottom;
            setHeight(calculatedHeight);
        }
    });

    return [refContainer, height];
};

export default useContentHeight;