import React from "react";
import { Pagination } from "react-bootstrap";

const Paginator: React.FC<
  React.PropsWithChildren<{
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
  }>
> = ({ currentPage, lastPage, onPageChange }) => {
  const pages = [];

  let startPage = Math.max(1, currentPage - 2);
  let endPage = Math.min(lastPage, currentPage + 2);

  if (lastPage <= 5) {
    startPage = 1;
    endPage = lastPage;
  } else if (currentPage <= 3) {
    startPage = 1;
    endPage = 5;
  } else if (currentPage >= lastPage - 2) {
    startPage = lastPage - 4;
    endPage = lastPage;
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(
      <Pagination.Item
        key={i}
        active={i === currentPage}
        onClick={() => {
          onPageChange(i);
        }}
      >
        {i}
      </Pagination.Item>
    );
  }

  return (
    <div className="my-4">
      <Pagination className="justify-content-center">
        <Pagination.Prev
          disabled={currentPage <= 1}
          onClick={() => {
            onPageChange(currentPage - 1);
          }}
        />
        {pages}
        <Pagination.Next
          disabled={currentPage >= lastPage}
          onClick={() => {
            onPageChange(currentPage + 1);
          }}
        />
      </Pagination>
    </div>
  );
};

export default Paginator;
