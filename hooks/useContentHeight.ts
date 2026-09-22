import {useRef, useState, useLayoutEffect, type RefObject} from "react";

const useContentHeight = (): [RefObject<HTMLDivElement>, number] => {
    const refContainer = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useLayoutEffect(() => {
        const container = refContainer.current;
        if (!container) return;

        const updateHeight = () => {
            const computedStyle = window.getComputedStyle(container);

            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);

            const calculatedHeight = container.clientHeight - paddingTop - paddingBottom;
            setHeight(Math.max(0, calculatedHeight));
        };

        updateHeight();
        const observer = new ResizeObserver(updateHeight);
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    return [refContainer, height];
};

export default useContentHeight;
