export const getMessage = (error: any) => {
  const message =
    (error.data && error.data.message) ||
    error.message ||
    "An error has occured";

  return message;
};
