export const PlusIcon = ({...restProps}) => (
    <svg height="100" width="100" xmlns="http://www.w3.org/2000/svg" {...restProps}>
        <circle r="45" cx="50" cy="50" fill="#1a1b1c" stroke="#2990ff" strokeWidth="4"/>
        <line x1="30" y1="50" x2="70" y2="50" style={{stroke: "#e5e7eb", strokeWidth: 4}} strokeLinecap="round"/>
        <line x1="50" y1="30" x2="50" y2="70" style={{stroke: "#e5e7eb", strokeWidth: 4}} strokeLinecap="round"/>
    </svg>
);