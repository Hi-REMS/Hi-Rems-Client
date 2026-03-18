import axios from 'axios'
import router from '@/router';

export const api = axios.create({
  baseURL: '/api',
  timeout: 100000,
  withCredentials: true,
})

let isAlerting = false;

api.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    if (error.response && error.response.status === 401) {
      
      if (!isAlerting) {
        isAlerting = true;

        const errorMessage = error.response.data?.message;
        if (errorMessage) {
          alert(errorMessage); 
        } else {
          alert('로그인이 만료되었습니다. 다시 로그인해 주세요.');
        }
        router.push('/login');

        setTimeout(() => {
          isAlerting = false;
        }, 3000);
      }
    }
    
    return Promise.reject(error);
  }
);