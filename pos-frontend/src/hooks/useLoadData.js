import { useDispatch } from "react-redux";
import { getUserData } from "../https";
import { useEffect, useState } from "react";
import { removeUser, setUser } from "../redux/slices/userSlice";
import { useNavigate, useLocation } from "react-router-dom";

const useLoadData = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Không gọi API nếu đang ở route /table/:id (khách vãng lai) hoặc debug
    if (location.pathname.startsWith('/table/') || location.pathname === '/debug') {
      console.log('🚫 Skipping user auth check for:', location.pathname);
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        console.log('🔍 Fetching user data...');
        const { data } = await getUserData();
        console.log('✅ User data received:', data);
        const { _id, name, email, phone, role } = data.data;
        dispatch(setUser({ _id, name, email, phone, role }));
      } catch (error) {
        console.log('❌ User auth failed:', error.message);
        dispatch(removeUser());
        
        // Only redirect to auth if not already on auth page
        if (location.pathname !== '/auth') {
          console.log('🔄 Redirecting to auth...');
          navigate("/auth");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [dispatch, navigate, location.pathname]);

  return isLoading;
};

export default useLoadData;
