// pages/create/create.js
const app = getApp()
var larp = require('../../utils/util.js')
var md5 = require('../../utils/md5.js')
function makerd() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 10; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};
Page({
  data: {
    gameid: '',
    gamename: '',
    tableid:'',
    tablepw:'',
    gamedescription:'',
    characterlist:[]
  },

  deleteroom: function () {
    wx.showToast({
      title: '正在删除房间',
      icon: "loading"
    })
    wx.removeStorageSync('createdtable')
    wx.removeStorageSync('createdgame')
    var that=this
    var user
    wx.request({
      url: larp.backendurl + '?type=table&tableid=' + that.data.tableid,
      success: function (res) {
        if(res.data.length!=0){
        wx.request({
          url: larp.backendurl + '/' + res.data[0]._id,
          method: 'DELETE',
          data: {
            signature: md5.hexMD5(res.data[0]._id + "xiaomaomi")
          },
          complete: function(){
            console.log('deleted')
            wx.reLaunch({
              url: '../shop/shop'
            })
            wx.hideToast()
          }
        })
        }else{
          wx.reLaunch({
            url: '../shop/shop'
          })
        }
      }
    })
    wx.request({
      url: larp.backendurl + '?type=user&tableid=' + that.data.tableid,
      success: function (res) {
        console.log(res.data)
        for(user in res.data){
        wx.request({
          url: larp.backendurl + '/' + res.data[user]._id,
          data: {
            signature: md5.hexMD5(res.data[user]._id + "xiaomaomi")
          },
          method: 'DELETE',
          success: function () {
          },
        })
        }
      },
    })
  },

  onLoad: function (options) {
    wx.showToast({
      title: '正在加载信息',
      icon: "loading"
    })
    wx.hideShareMenu()
    let that = this
    if(options.tableid){
      console.log("enter created room")
      wx.request({
        url: larp.backendurl + '?type=table&select=gamename&select=tableid&select=gameid&tableid=' + options.tableid,
        success: function (res) {
          console.log(res.data)
          if(res.data.length!=0){
          that.setData({
            gamename: res.data[0].gamename,
            tableid: res.data[0].tableid,
            gameid: res.data[0].gameid
          })
          wx.request({
            url: larp.backendurl + '?type=character&select=characterid&select=charactername&select=characterdescription&select=charactersex&gameid=' + that.data.gameid,
            success: function (res) {
              wx.hideToast()
              that.setData({
                characterlist: res.data
              })
            }
          })
          }
        }
      })
      console.log("already have "+ that.data.tableid)
    }else{
      this.setData({
        gameid: options.gameid,
      })
      var tableid = makerd()
      wx.request({
        url: larp.backendurl + '?type=game&select=name&select=cluestatus&id=' + options.gameid,
        success: function (res) {
          that.setData({
            gamename: res.data[0].name,
            tableid: tableid
        })
        wx.request({
          url: larp.backendurl + '?type=character&select=characterid&select=charactername&select=characterdescription&select=charactersex&gameid=' + options.gameid,
          success: function (res) {
            wx.hideToast()
            that.setData({
              characterlist: res.data
            })
          }
        })
        wx.request({
          url: larp.backendurl,
          data: {
            type: "table",
            hostid: app.globalData.unionid,
            tableid: tableid,
            gamename: res.data[0].name,
            gameid: options.gameid,
            vote: [],
            globalbroadcast:[],
            roundnumber: 0,
            cluestatus: res.data[0].cluestatus,
            signature:md5.hexMD5("xiaomaomi")
          },
          method: "POST",
          success: function (res) {
            wx.setStorage({
              key: "createdgame",
              data: options.gameid
            });
            wx.setStorage({
              key: "createdtable",
              data: tableid
            });
            wx.hideToast()
          },
        });
      },
    });
    }
  },
  /*
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    let that = this
    //console.log(res)
    if (res.target.id == 'info') {
      // 来自页面内转发按钮
      console.log("pages/distribute/distribute?tableid=" + that.data.tableid + "&gameid=" + that.data.gameid + "&type=table")
    return {
      title: '游戏及人介绍',
      imageUrl: '/icon/detect_shop.png',
      path: 'pages/distribute/distribute?tableid=' + that.data.tableid + '&gameid=' + that.data.gameid + '&type=table',
    }
    } else if(res.target.id=='host') {
      // 来自页面内转发按钮
      return {
        title: '人物码: 主持人',
        imageUrl: '/icon/detect_shop.png',
        path: 'pages/distribute/distribute?tableid=' + that.data.tableid + '&gameid=' + that.data.gameid + '&type=host'
      }
    } else {
      function check(char) {
        return char.characterid ==res.target.id;
      }
      return {
        title: '人物码: ' + that.data.characterlist.filter(check)[0].charactername,
        imageUrl: '/icon/detect_shop.png',
        path: 'pages/distribute/distribute?id=' + res.target.id + '&tableid=' + that.data.tableid + '&gameid=' + that.data.gameid + '&type=character'
      }
    }
  },
})