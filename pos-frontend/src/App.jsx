import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router-dom";
import { Home, Auth, Orders, Tables, Menu, Dashboard, TableMenu, OrderTracking, Inventory, MenuManagement, More, EmployeeManagement, OrderHistory, PaymentHistory, DishDeployment } from "./pages";
import KitchenDisplay from "./pages/KitchenDisplay";
import Debug from "./pages/Debug";
import OrderFlowTest from "./pages/OrderFlowTest";
import Header from "./components/shared/Header";
import { useSelector } from "react-redux";
import useLoadData from "./hooks/useLoadData";
import FullScreenLoader from "./components/shared/FullScreenLoader";
import { SocketProvider } from "./contexts/SocketContext";

function Layout() {
  const isLoading = useLoadData();
  const location = useLocation();
  const hideHeaderRoutes = ["/auth"];
  const { isAuth } = useSelector(state => state.user);

  if(isLoading) return <FullScreenLoader />

  // Ẩn header cho route /table/:id và /order (khách vãng lai)
  const shouldHideHeader = hideHeaderRoutes.includes(location.pathname) || 
                          location.pathname.startsWith('/table/') ||
                          location.pathname.startsWith('/order');

  return (
    <>
      {!shouldHideHeader && <Header />}
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoutes>
              <Home />
            </ProtectedRoutes>
          }
        />
        <Route path="/auth" element={isAuth ? <Navigate to="/" /> : <Auth />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoutes>
              <Orders />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/tables"
          element={
            <ProtectedRoutes>
              <Tables />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu"
          element={
            <ProtectedRoutes>
              <Menu />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoutes>
              <Dashboard />
            </ProtectedRoutes>
          }
        />
        <Route path="/table/:id" element={<TableMenu />} />
        <Route path="/order" element={<OrderTracking />} />
        <Route path="/order/:orderId" element={<OrderTracking />} />
        <Route path="/debug" element={<Debug />} />
        <Route path="/test-order-flow" element={<OrderFlowTest />} />
        <Route
          path="/inventory"
          element={
            <ProtectedRoutes>
              <Inventory />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/menu-management"
          element={
            <ProtectedRoutes>
              <MenuManagement />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/more"
          element={
            <ProtectedRoutes>
              <More />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/employee-management"
          element={
            <ProtectedRoutes>
              <EmployeeManagement />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/order-history"
          element={
            <ProtectedRoutes>
              <OrderHistory />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/payment-history"
          element={
            <ProtectedRoutes>
              <PaymentHistory />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/dish-deployment"
          element={
            <ProtectedRoutes>
              <DishDeployment />
            </ProtectedRoutes>
          }
        />
        <Route
          path="/kitchen"
          element={
            <ProtectedRoutes>
              <KitchenDisplay />
            </ProtectedRoutes>
          }
        />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </>
  );
}

function ProtectedRoutes({ children }) {
  const { isAuth } = useSelector((state) => state.user);
  if (!isAuth) {
    return <Navigate to="/auth" />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <SocketProvider>
        <Layout />
      </SocketProvider>
    </Router>
  );
}

export default App;
