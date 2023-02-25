import React from "react";
import styles from "./TagButtonPanel.module.css";

const TagButtonPanel: React.FC<
  React.PropsWithChildren<{ onClick: (value: string) => void }>
> = ({ onClick }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onClick(e.currentTarget!.value);
  };

  return (
    <div
      className={`btn-group ${styles.blocks}`}
      role="group"
      aria-label="Basic example"
    >
      <button
        type="button"
        className="btn btn-primary"
        value="i"
        onClick={handleClick}
      >
        [i]
      </button>
      <button
        type="button"
        className="btn btn-primary"
        value="strong"
        onClick={(e) => onClick(e.currentTarget.value)}
      >
        [strong]
      </button>
      <button
        type="button"
        className="btn btn-primary"
        value="code"
        onClick={(e) => onClick(e.currentTarget.value)}
      >
        [code]
      </button>
      <button
        type="button"
        className="btn btn-primary"
        value="a"
        onClick={(e) => onClick(e.currentTarget.value)}
      >
        [a]
      </button>
    </div>
  );
};

export default TagButtonPanel;
