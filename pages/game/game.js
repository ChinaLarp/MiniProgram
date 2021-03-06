var larp = require('../../utils/util.js')
var md5 = require('../../utils/md5.js')
const app = getApp()
Page({
  data: {
    gameinfo: null,
    characterlist: null,
    purchased:null
  },
  unlock:function(){
    let that=this
    wx.request({
      method: "POST",
      data: {
        openid: app.globalData.unionid,
        total_fee:this.data.gameinfo.price
      },
      url: 'https://chinabackend.bestlarp.com/unifiedorder',
      success: function (res) {
        console.log(res.data.xml.prepay_id)
        wx.requestPayment(
          {
            'timeStamp': '1490840662',
            'nonceStr': '123',
            'package': 'prepay_id=' + res.data.xml.prepay_id,
            'signType': 'MD5',
            'paySign': md5.hexMD5("appId=wxf0487d45228f02d3&nonceStr=123&package=prepay_id=" + res.data.xml.prepay_id + "&signType=MD5&timeStamp=1490840662&key=6e11af317a7a85a14b3387d5c6c71d3a").toUpperCase(),
            'success': function (res) {
              console.log("success")
              wx.request({
                method: "POST",
                data: {
                  type:"purchase",
                  id: app.globalData.unionid,
                  gameid: that.data.gameid,
                  price: that.data.gameinfo.price,
                  signature: md5.hexMD5("xiaomaomi")
                },
                url: 'https://chinabackend.bestlarp.com/api/app',
                success: function (res) {
                  console.log("documented")
                  wx.reLaunch({
                    url: '../game/game?gameid=' + that.data.gameid,
                  })
                }
              })},
            'fail': function (res) { console.log("failed") },
            'complete': function (res) { console.log("complete") }
          })
      }
    })
  },
  howto: function(e){
    wx.showModal({
      title: '购买须知',
      content: '点击下方解锁游戏按钮将永久解锁该游戏，可以无限次创建此游戏房间。一局游戏仅创建者一人需要解锁。',
      showCancel:false,
    })
  },
  create: function () {
    let that = this
    wx.showToast({
      title: '正在创建房间',
      icon: "loading"
    })
    if (this.data.createdgame && this.data.createdgame == this.data.gameinfo.id) {
      wx.navigateTo({
        url: '../create/create?tableid=' + this.data.createdtable
      })
    }else if (this.data.createdgame){
      wx.showModal({
        title: '已创建房间',
        content: '请先进入并删除已创建房间。',
        cancelText: '取消',
        confirmText: '进入',
        success: function(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: '../create/create?tableid=' + that.data.createdtable
            })
          } else if (res.cancel) {
          }
        },
      })
    }else{
      wx.request({
        url: larp.backendurl + '?type=table&hostid=' + app.globalData.unionid,
        success: function (res) {
          var table
          for (table in res.data) {
            wx.request({
              url: larp.backendurl + '/' + res.data[table]._id,
              data: { signature: md5.hexMD5(res.data[table]._id + "xiaomaomi") },
              method: 'DELETE'
            })
            wx.request({
              url: larp.backendurl + '?type=user&tableid=' + res.data[table].tableid,
              success: function (res) {
                var player
                wx.request({
                  url: larp.backendurl + '/' + res.data[player]._id,
                  data: { signature: md5.hexMD5(res.data[player]._id + "xiaomaomi") },
                  method: 'DELETE'
                })
              }
            })
          }
        }
      })
      wx.request({
        url: larp.backendurl + '?type=user&usernickname=' + app.globalData.unionid,
        success: function (res) {
          var user
          for (user in res.data) {
            wx.request({
              url: larp.backendurl + '/' + res.data[user]._id,
              data: { signature: md5.hexMD5(res.data[user]._id + "xiaomaomi") },
              method: 'DELETE',
              success: function (res) {
              }
            })
          }
        }
      })
    wx.navigateTo({
      url: '../create/create?gameid=' + this.data.gameinfo.id
      })
    }
    wx.hideToast()
  },
  onLoad: function (options) {
    let that = this
    wx.showToast({
      title: '加载中',
      icon: "loading"
    })
    if (options.gameid) {
      wx.request({
        url: 'https://chinabackend.bestlarp.com/api/app?type=game&id=' + options.gameid + '&select=name&select=descripion&select=detailDescription&select=femalenumber&select=malenumber&select=price&select=id&select=coverurl',
        success: function (res) {
          if (res.data.length != 0) {
            that.setData({
              gameinfo: res.data[0],
              gameid: options.gameid
            })
          }
        }
      })
      wx.request({
        url: 'https://chinabackend.bestlarp.com/api/app?type=character&gameid=' + options.gameid + '&select=charactername&select=characterdescription&select=charactersex',
        success: function (res) {
          if (res.data.length != 0) {
            that.setData({
              characterlist: res.data,
            })
            wx.hideToast()
          }
        }
      })
      wx.request({
        url: 'https://chinabackend.bestlarp.com/api/app?type=purchase&id=' + app.globalData.unionid + '&gameid=' + options.gameid ,
        success: function (res) {
          if (res.data.length != 0) {
            //console.log(res.data[0].purchasehistory.map(function(purchase){return purchase.gameid}).indexOf(options.gameid))
            that.setData({
              purchased: true,
            })
          }
        } 
      })
    }else{
      wx.reLaunch({
        url: '../shop/shop',
      })
    }
  },
  onShow: function(){
    this.setData({
      createdgame: wx.getStorageSync('createdgame'),
      createdtable: wx.getStorageSync('createdtable')
    })
  }
})
