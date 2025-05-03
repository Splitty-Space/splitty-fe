import classNames from "classnames";
import "./loader.css";

const Loader = ({className}: { className?: string }) => {
    return <div className={classNames("loader", className)}/>;
};

export default Loader;