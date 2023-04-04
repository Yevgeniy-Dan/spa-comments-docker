// The padStart() method is used to ensure that the random number always has 4 digits, even if it starts with zeros.
function generateUniqueId() {
  const timestamp = Date.now().toString();
  const randomNum = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return parseInt(timestamp + randomNum);
}

export default generateUniqueId;
