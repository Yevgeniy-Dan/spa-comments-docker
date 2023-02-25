import React from "react";

import classes from "./AppSpinner.module.css";

const AppSpinner: React.FC<React.PropsWithChildren<{}>> = (props) => {
  return (
    <div className={classes.loadingSpinnerContainer}>
      <div className={classes.loadingSpinner}></div>
    </div>
  );
};

export default AppSpinner;
