import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/Admin/AdminSidebar';
import AdminHeader from '../../components/Admin/AdminHeader';
import { Trash2, Eye, X } from 'lucide-react';

const AdminContact = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/contact', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Xóa liên hệ này?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contact/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        fetchRequests();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/contact/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();
      if (data.success) {
        fetchRequests();
        if (selectedRequest) {
          setSelectedRequest({ ...selectedRequest, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className="admin-root" style={{ display: 'flex' }}>
      <AdminSidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AdminHeader />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quản Lý Liên Hệ</h1>
          <p className="text-gray-600 mb-6">Danh sách liên hệ từ khách hàng</p>

      {/* Stats */}
      <div className="mb-6 p-4 bg-blue-100 rounded" style={{ borderLeft: '4px solid #0ea5e9' }}>
        <div className="text-sm text-gray-600">Tổng cộng</div>
        <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }} className="border-b">
              <th className="px-6 py-3 text-left font-semibold">ID</th>
              <th className="px-6 py-3 text-left font-semibold">Tên / Email</th>
              <th className="px-6 py-3 text-left font-semibold">Điện Thoại</th>
              <th className="px-6 py-3 text-left font-semibold">Ngày Gửi</th>
              <th className="px-6 py-3 text-left font-semibold">Trạng Thái</th>
              <th className="px-6 py-3 text-center font-semibold">Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-gray-700">#{req.id}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold">{req.name}</div>
                  <div className="text-sm text-gray-600">{req.email}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">{req.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(req.created_at).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    req.status === 'resolved' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {req.status === 'resolved' ? 'Đã Xử Lý' : 'Đang Xử Lý'}
                  </span>
                </td>
                <td className="px-6 py-4 text-center flex gap-2 justify-center">
                  <button
                    onClick={() => handleOpenModal(req)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(req.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {requests.length === 0 && (
          <div className="px-6 py-12 text-center text-gray-600">
            Không có liên hệ nào
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-8 border-b sticky top-0 bg-white">
              <h2 className="text-3xl font-bold">Chi Tiết Liên Hệ</h2>
              <button onClick={() => setShowModal(false)}>
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-lg font-semibold text-gray-600 block mb-3">Tên</label>
                  <p className="text-2xl text-gray-800 bg-gray-50 p-4 rounded">{selectedRequest.name}</p>
                </div>
                <div>
                  <label className="text-lg font-semibold text-gray-600 block mb-3">Email</label>
                  <p className="text-2xl text-gray-800 bg-gray-50 p-4 rounded">{selectedRequest.email}</p>
                </div>
              </div>

              <div>
                <label className="text-lg font-semibold text-gray-600 block mb-3">Điện Thoại</label>
                <p className="text-2xl text-gray-800 bg-gray-50 p-4 rounded">{selectedRequest.phone || '-'}</p>
              </div>

              <div>
                <label className="text-lg font-semibold text-gray-600 block mb-3">Nội Dung</label>
                <p className="text-xl text-gray-800 bg-gray-50 p-6 rounded whitespace-pre-wrap leading-relaxed">{selectedRequest.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="text-lg font-semibold text-gray-600 block mb-3">Gửi Lúc</label>
                  <p className="text-xl text-gray-800 bg-gray-50 p-4 rounded">
                    {new Date(selectedRequest.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>

                <div>
                  <label className="text-lg font-semibold text-gray-600 block mb-3">Trạng Thái</label>
                  <select
                    value={selectedRequest.status}
                    onChange={(e) => handleUpdateStatus(selectedRequest.id, e.target.value)}
                    className="w-full px-4 py-3 text-xl border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">Đang Xử Lý</option>
                    <option value="resolved">Đã Xử Lý</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-8 border-t sticky bottom-0 bg-gray-50">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-3 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 text-lg font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default AdminContact;
