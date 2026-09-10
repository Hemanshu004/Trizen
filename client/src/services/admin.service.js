import api from './api';

const adminService = {
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data.data;
  },

  getProviders: async (params) => {
    // Expected params: { page, limit, search, status, category }
    const response = await api.get('/admin/providers', { params });
    return response.data.data;
  },

  getProviderDetail: async (id) => {
    const response = await api.get(`/admin/providers/${id}`);
    return response.data.data;
  },

  approveProvider: async (id) => {
    const response = await api.patch(`/admin/providers/${id}/approve`);
    return response.data.data;
  },

  rejectProvider: async (id, rejectionRemark) => {
    const response = await api.patch(`/admin/providers/${id}/reject`, { rejectionRemark });
    return response.data.data;
  },

  getDocumentBlob: async (providerId, documentId, download = false) => {
    const url = `/admin/providers/${providerId}/documents/${documentId}${download ? '?download=true' : ''}`;
    const response = await api.get(url, {
      responseType: 'blob' // Important: treat response as binary data
    });
    return response.data;
  }
};

export default adminService;
