import { createRouter, createWebHistory } from 'vue-router'
import HomePageView from '../views/HomePageView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePageView
    },
    {
      path: '/hourly',
      name: 'hourly',
      component: () => import('../views/WeatherMapView.vue')
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('../views/DailyForecastView.vue')
    },
    {
      path: '/map-view',
      name: 'map-view',
      component: () => import('../views/WeatherMapView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue')
    }
  ]
})

export default router
