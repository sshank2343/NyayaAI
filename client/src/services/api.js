import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Change this to your backend URL

const api= axios.create({
    baseURL: API_URL,
    withCredentials:true,   // Include cookies for authentication
});

api.interceptors.request.use((config)=>{
    const token = localStorage.getItem('accessToken');
    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error))

// handle expired token
api.interceptors.response.use(
    (response)=> response,
    async(error)=>{
        const originalRequest = error.config;

        if(error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;
            try{
                // Silently ask the backend for a new token using our secure cookie
                const res = await axios.get(`${API_URL}/auth/refresh`, { withCredentials: true });

                // save the token
                localStorage.setItem('accessToken',res.data.accessToken);

                originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
                return api(originalRequest);
            } catch(refreshError){
                console.error("Session is expired. Please login again.");
                localStorage.removeItem('accessToken');
                window.location.href = '/login'; // Redirect to login page
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);
export default api;