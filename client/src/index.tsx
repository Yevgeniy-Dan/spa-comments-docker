import ReactDOM from "react-dom/client";
import MainPage from "./components/Dashboard/MainPage";
import { Provider } from "react-redux";
import store from "./store";
import "bootstrap/dist/css/bootstrap.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <Provider store={store}>
    <MainPage />
  </Provider>
);
