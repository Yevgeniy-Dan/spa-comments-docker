import React from "react";

const Paginator: React.FC<
  React.PropsWithChildren<{
    currentPage: number;
    lastPage: number;
    onPrevious: () => void;
    onNext: () => void;
  }>
> = ({ currentPage, onPrevious, lastPage, onNext }) => {
  return (
    <div className="my-4">
      <ul className="pagination justify-content-center">
        <li className={`page-item  ${currentPage <= 1 && "disabled"}`}>
          <div
            className="page-link"
            aria-disabled="true"
            style={{ cursor: "pointer" }}
            onClick={onPrevious}
          >
            Previous
          </div>
        </li>
        <li className="page-item">
          <div className="page-link" style={{ cursor: "pointer" }}>
            {currentPage}
          </div>
        </li>
        <li className={`page-item  ${currentPage >= lastPage && "disabled"}`}>
          <div
            className="page-link"
            style={{ cursor: "pointer" }}
            onClick={onNext}
          >
            Next
          </div>
        </li>
      </ul>
    </div>
  );
};

export default Paginator;
