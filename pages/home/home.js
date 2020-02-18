// pages/home/home.js
import {
  Theme
} from '../../model/theme'
import {
  Banner
} from '../../model/banner'
import {
  WaterFlow
} from '../../model/waterFlow'
import {
  Category
} from '../../model/category'
import {
  Activity
} from '../../model/activity'
import {
  Tag
} from '../../model/tag'
import { promisic } from '../../miniprogram_npm/lin-ui/utils/util'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    toptheme: [],
    bannerB: null,
    grid: [],
    activity: null,
    items: [],
    skuLatest: null,
    start_num: 0,
    loading: false,
    requestStatus_skuLate: true,
    loading_text: '努力加载中...',
    loading_show: true
  },

  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad (options) {
    this.initAllData()

  },

  async initAllData () {
    // resolve 的参数作为 await 表达式的运算结果。 ThemeModel.getLocationA_theme()返回的是一个Promise对象
    const theme = new Theme()
    // 初始化数据填充themes [] 让对象去保存数据、状态
    await theme.getThemes()
    const themeA = theme.getLocationA()
    const bannerB = await Banner.getLocationB()
    const gridC = await Category.getLocationC()
    const activityD = await Activity.getLocationD()
    // 我们将硬编码的数据't-2' 放在类内部处理掉 await Theme.getLocationESpu('t-2')
    // 由于scollersE对应的是每日上新 因此我们可以加个判断是否上下架子
    let scollersE = null
    let scollE_spu_List
    if (themeA.online) {
      scollersE = await Theme.getLocationESpu()
      if (scollersE) {
        scollE_spu_List = scollersE["spu_list"].slice(0,7) //截取长度为8
      }
    }
    const themeF = theme.getLocationF()
    const bannerG = await Banner.getLocationG()
    const selling_arr = bannerG.items
    const themeH = theme.getLocationH()
    //----------------skuList------------------
    const skuLatest_res = await WaterFlow.getSkuLatest()
    // console.log(skuLatest_res)
    const skuLatest = skuLatest_res['data']
    const items_arr = this.processData_SkuLatest(skuLatest.items)
    // console.log(items_arr)
    // 提取出获取数据的 init方法避免多次setData
    //.slice(0,2)

    // console.log(bannerB.items)
    this.setData({
      themeA: themeA,
      bannerB: bannerB,
      gridC: gridC,
      activityD: activityD,
      scollersE: scollersE,
      scollE_spu_List:scollE_spu_List,
      themeF: themeF,
      bannerG: bannerG,
      themeH: themeH,
      arr: selling_arr,
      items: items_arr,
      skuLatest: skuLatest,
    })
    this.init_waterFlow()

  },
  init_waterFlow () {
    if (this.data.items !== []) {
      wx.lin.renderWaterFlow(this.data.items, false, () => {
        // console.log('渲染成功')
      })
    }
  },
  processData_SkuLatest (items) {
    let item_arr = []
    for (let i = 0, length = items.length; i < length; i++) {
      let item = {
        id: items[i].id,
        image: items[i].img,
        title: items[i].title,
        describe: items[i].subtitle,
        count: items[i].price,
        delCount: items[i].discount_price,
        tags: items[i].tags
      }
      item_arr.push(item)

    }
    return item_arr
  },

  async onTapping(event){
    console.log(event.detail.id)
    const id = event.detail.id
    await promisic(wx.navigateTo)({
      url: `/pages/product/product?id=${id}`
    })
  },
  async onReachBottom (event) {
    let start_num
    // 判断当前请求情况 假如是正常的状态 每次就 增5
    if (this.data.requestStatus_skuLate) {
      start_num = this.data.start_num += 5
    } else {
      // 否则让客户端发送重复的请求
      start_num = this.data.start_num
    }
    // 加锁 防止多次重复触底发送请求 等待一个请求完成后 渲染完成后再次允许发送请求
    if (this._isloading()) {
      // loading 为true 时 return
      return
    }
    this._locked() // 加锁 防止同一时间节点 重复发送请求
    this.setData({
      start_num: start_num,

    })
    // 因为promise的reject 报错 是不往外抛的 我们用catch去获取错误信息
    const skuLatest_res = await WaterFlow.getSkuLatest(start_num).catch((reason) => {
      if (reason.errMsg) {
        // 请求失败 更改请求状态
        this.setData({
          requestStatus_skuLate: false
        })
        // 解锁 因为假如在失败情况下不解锁 的后果：
        // 会造成死锁 因为程序卡在了这个异常地方不走下去了就会一直处于locked
        // 解决方案：在错误状态下的catch代码块里是能执行的 在里面去开锁即可
        console.log("test open lock")
        this._unlocked()
      }
    })
    if (skuLatest_res.statusCode === 200) {
      this.setData({
        // true代表请求成功的
        requestStatus_skuLate: true
      })
    }
    // #注：获取完整的response 需要statusCode和错误信息
    const skuLatest = skuLatest_res['data']
    let _items_new = skuLatest.items
    //判断当前的sku_arr是否为空数组
    // 1）特殊场景断网 传递是[] 导致死锁 的处理 这边使用对状态和 断网情况错误信息判断对锁的状态同步进行改变
    const flag = this._hasMore(_items_new)
    // items_new数组是否为空来判断是否发送了一次完整的http请求
    // 是在网络良好 成功发送请求 响应能获取数组 这个逻辑下进行的 所以上面需要对网络异常的情况进行处理
    if (flag) {
      this._unlocked()
      const items_new = this.processData_SkuLatest(_items_new)
      // 旧数组拼接原来新数组 保证渲染内容是顺次递增的
      const items_arr = this.data.items.concat(items_new)
      this.setData({
        items: items_arr,
        skuLatest: skuLatest,
      })
      this.init_waterFlow()
    } else {
      if (this.data.requestStatus_skuLate) {
        this.setData({
          loading_text: '已经到底啦~',
        })
        setTimeout(() => {
          this.setData({
            loading_show: false
          })
        }, 500)
      }
      // 加锁 禁止继续发送请求
      this._locked()
    }
  },

  _hasMore (arr_skuLatest) {
    return arr_skuLatest.length !== 0

  },
  // 是否在加载中 true
  _isloading () {
    return this.data.loading === true
  },

  _locked () {
    this.setData({
      loading: true
    })
  },

  _unlocked () {
    this.setData({
      loading: false
    })
  }

})