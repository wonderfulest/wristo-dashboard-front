import axios from '@/config/axios'

export const purchaseByCode = (code: string) => {
  return axios.post('/trials/v1/purchase', { code })
}

export const createPaypalOrder = (request: any) => {
  return axios.post('/paypal/orders', request)
}

export const capturePaypalOrder = (orderId: string) => {
  return axios.post(`/paypal/orders/${orderId}/capture`)
}