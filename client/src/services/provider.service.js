import api from './api';

const providerService = {
  getProfile: async () => {
    const { data } = await api.get('/providers/me');
    return data.data;
  },
  
  updateProfile: async (profileData) => {
    const { data } = await api.put('/providers/me', profileData);
    return data.data;
  },
  
  submitApplication: async () => {
    const { data } = await api.post('/providers/me/submit');
    return data;
  },
  
  getStatus: async () => {
    const { data } = await api.get('/providers/me/status');
    return data.data;
  },

  uploadPhoto: async (formData) => {
    const { data } = await api.post('/providers/me/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  uploadDocument: async (formData) => {
    const { data } = await api.post('/providers/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  },

  deleteDocument: async (documentId) => {
    const { data } = await api.delete(`/providers/me/documents/${documentId}`);
    return data.data;
  }
};

export default providerService;
