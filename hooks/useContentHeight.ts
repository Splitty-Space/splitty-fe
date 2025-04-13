import {useRef, useState, useEffect} from "react";

const useContentHeight = (): [React.RefObject<HTMLDivElement>, number] => {
    const ref = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(0);

    useEffect(() => {
        if (ref.current) {
            const computedStyle = window.getComputedStyle(ref.current);

            const paddingTop = parseFloat(computedStyle.paddingTop);
            const paddingBottom = parseFloat(computedStyle.paddingBottom);

            const calculatedHeight = ref.current.clientHeight - paddingTop - paddingBottom;
            setHeight(calculatedHeight);
        }
    }, []);

    return [ref, height];
};

export default useContentHeight;