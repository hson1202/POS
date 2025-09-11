import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaUsers, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { enqueueSnackbar } from 'notistack';
import { axiosWrapper } from '../https/axiosWrapper';
import BottomNav from '../components/shared/BottomNav';

const EmployeeManagement = () => {
  const { role } = useSelector(state => state.user);
  const navigate = useNavigate();
  const isAdmin = role === 'admin';
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'employee'
  });

  useEffect(() => {
    if (!isAdmin) return;
    fetchEmployees();
  }, [isAdmin]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axiosWrapper.get('/api/user/all');
      setEmployees(response.data.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      enqueueSnackbar('Không thể tải danh sách nhân viên', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingEmployee) {
        // Update employee
        const updateData = { ...formData };
        if (!updateData.password) {
          delete updateData.password; // Don't update password if empty
        }
        
        await axiosWrapper.put(`/api/user/${editingEmployee._id}`, updateData);
        enqueueSnackbar('Cập nhật nhân viên thành công', { variant: 'success' });
      } else {
        // Create new employee
        await axiosWrapper.post('/api/user/register', formData);
        enqueueSnackbar('Thêm nhân viên thành công', { variant: 'success' });
      }
      
      setShowModal(false);
      setEditingEmployee(null);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
      enqueueSnackbar(error.response?.data?.message || 'Có lỗi xảy ra', { variant: 'error' });
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      password: '',
      role: employee.role
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Bạn có chắc muốn xóa nhân viên này?')) return;
    
    try {
      await axiosWrapper.delete(`/api/user/${employeeId}`);
      enqueueSnackbar('Xóa nhân viên thành công', { variant: 'success' });
      fetchEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
      enqueueSnackbar('Không thể xóa nhân viên', { variant: 'error' });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'employee'
    });
  };

  const openAddModal = () => {
    setEditingEmployee(null);
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEmployee(null);
    resetForm();
    setShowPassword(false);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-400 bg-red-900/20';
      case 'manager': return 'text-blue-400 bg-blue-900/20';
      case 'employee': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'manager': return 'Quản lý';
      case 'employee': return 'Nhân viên';
      default: return role;
    }
  };

  // Kiểm tra quyền admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center justify-center h-[60vh] text-center">
            <div className="bg-red-900/20 border border-red-500 rounded-full p-8 mb-6">
              <FaLock className="text-6xl text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Truy cập bị từ chối</h1>
            <p className="text-[#ababab] text-lg mb-6 max-w-md">
              Trang này chỉ dành cho Admin. Bạn không có quyền truy cập vào tính năng quản lý nhân viên.
            </p>
            <button
              onClick={() => navigate('/more')}
              className="bg-[#F6B100] text-[#1a1a1a] px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
            >
              Quay lại trang More
            </button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded mb-6"></div>
            <div className="h-12 bg-gray-700 rounded mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F6B100]">Quản lý nhân viên</h1>
            <p className="text-[#ababab] mt-2">Thêm, sửa, xóa nhân viên</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#F6B100] text-[#1a1a1a] px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition-colors flex items-center gap-2"
          >
            <FaPlus />
            Thêm nhân viên
          </button>
        </div>

        {/* Employee List */}
        <div className="bg-[#262626] rounded-lg border border-[#3a3a3a] overflow-hidden">
          {employees.length > 0 ? (
            <div className="divide-y divide-[#3a3a3a]">
              {employees.map((employee) => (
                <div key={employee._id} className="p-4 hover:bg-[#2a2a2a] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-500/20 p-3 rounded-lg">
                        <FaUsers className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{employee.name}</p>
                        <p className="text-[#ababab] text-sm">{employee.email}</p>
                        <p className="text-[#ababab] text-sm">SĐT: {employee.phone}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(employee)}
                          className="bg-blue-500/20 text-blue-400 p-2 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          <FaEdit />
                        </button>
                        {employee.role !== 'admin' && (
                          <button
                            onClick={() => handleDelete(employee._id)}
                            className="bg-red-500/20 text-red-400 p-2 rounded-lg hover:bg-red-500/30 transition-colors"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <FaUsers className="text-4xl text-[#ababab] mx-auto mb-4" />
              <p className="text-[#ababab]">Chưa có nhân viên nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#262626] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">
              {editingEmployee ? 'Sửa nhân viên' : 'Thêm nhân viên'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
                  required
                />
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Mật khẩu {editingEmployee && '(để trống nếu không đổi)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100] pr-12"
                    required={!editingEmployee}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ababab] hover:text-white"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-[#ababab] mb-2 text-sm font-medium">
                  Vai trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-[#1f1f1f] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#F6B100]"
                >
                  <option value="employee">Nhân viên</option>
                  <option value="manager">Quản lý</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#F6B100] text-[#1a1a1a] py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                >
                  {editingEmployee ? 'Cập nhật' : 'Thêm'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-[#3a3a3a] text-white py-3 rounded-lg font-semibold hover:bg-[#4a4a4a] transition-colors"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <BottomNav />
    </div>
  );
};

export default EmployeeManagement; 