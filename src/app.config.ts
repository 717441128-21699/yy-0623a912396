export default defineAppConfig({
  pages: [
    'pages/alarm-list/index',
    'pages/disposal-list/index',
    'pages/mine/index',
    'pages/vehicle-detail/index',
    'pages/disposal-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '冷链补冷调度',
    navigationBarTextStyle: 'black',
    backgroundColor: '#f0f9ff'
  },
  tabBar: {
    color: '#94a3b8',
    selectedColor: '#0ea5e9',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/alarm-list/index',
        text: '告警队列'
      },
      {
        pagePath: 'pages/disposal-list/index',
        text: '处置单'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
