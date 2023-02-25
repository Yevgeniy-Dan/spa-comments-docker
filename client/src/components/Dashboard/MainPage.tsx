import AppForm from "../UI/AppForm";
import Comments from "../UI/Comments/Comments";

const MainPage = () => {
  return (
    <div className="container m-auto p-4">
      <AppForm />
      <Comments />
    </div>
  );
};

export default MainPage;
