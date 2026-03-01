import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

function Layout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Navbar />
        <section className="content">{children}</section>
      </main>
    </div>
  );
}

export default Layout;
