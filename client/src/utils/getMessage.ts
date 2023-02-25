export const getMessage = (error: any) => {
  const message =
    (error.data && error.data.data && error.data.data.message) ||
    error.data.message ||
    error.message ||
    "An error has occured";

  return message;
};
