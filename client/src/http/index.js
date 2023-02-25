import axios from "axios";

const api = axios.create({
  withCredentials: true,
  proxy: true,
});

export default api;
