const express = require('express')
const router = express.Router()
const url = require('url')
const data = require('../data/data.json')
const mysql = require('mysql')
const bodyParser = require('body-parser')
const cors = require('cors')
// 使用 createPool 建立连接池
router.use(cors())
const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    port: '3306',
    database: 'demo1',
})

// 每次进行数据库操作都要重新做 **获取连接池, 拿到数据, 释放连接** 这些操作
// 其他的跟普通的connection是一样的
// 连接池封装
const sqlQuery = (sql, values) => {
  return new Promise((resolve, reject) => {
      pool.getConnection((err, connection) => {
          if (err) {
              reject(err)
          } else {
              if (values) {
                  connection.query(sql, values, (err, rows) => {
                      if (err) {
                          reject(err)
                      } else {
                          resolve(rows)
                      }
                      connection.release()
                  })
              } else {
                  connection.query(sql, (err, rows) => {
                      if (err) {
                          reject(err)
                      } else {
                          resolve(rows)
                      }
                      connection.release()
                  })
              }
          }
      })
  })
}
router.use(bodyParser.json())
// app.use(bodyParser.urlencoded())
router.use(bodyParser.urlencoded({extended: true}))

router.get('/restaurantSelect', (req, res) => {
  let { query } = url.parse(req.url, true)
  let select = query.tableDataSelect
  console.log(query.tableDataSelect)
  res.send(data.tableDataSelect[select])
})

router.get('/restaurantList',async (req,res,next)=>{
  //数据
  try {
    let { query } = url.parse(req.url, true)
    let { region } = query
    console.log('region', region)
    let values = [region]
    let tableData = await sqlQuery('SELECT * FROM restaurant_list WHERE region = ?', values)
    res.send(tableData)
  } catch (error) {
    next(error)
  }
})

router.post('/addRestaurant', async (req, res, next) => {
    try {
        // console.log('参数', req.body)
        // let arr = []
        let values = {
            shopname: req.body.shopname,
            region: req.body.region,
            address: req.body.address,
            avatar: req.body.avatar,
            consumption: req.body.consumption,
            opentime: '周一至周日 ' + req.body.startTime + '-' + req.body.endTime,
            evaluate: req.body.evaluate
        }
        // values.opentime = '周一至周日 ' + req.body.startTime + '-' + req.body.endTime
        // values.evaluate = req.body.evaluate.toFixed(1)
        // values.consumption = '人均：'+ req.body.consumption
        // let opentime = '周一至周日 '
        // for (let a in req.body) {
        //     // arr.push(a)
        //     if (a === 'startTime') {
        //         opentime += req.body[a]
        //     } else if (a === 'endTime') {
        //         opentime = opentime + '-' + req.body[a]
        //     } else if (a === 'evaluate') {
        //         values[a] = req.body[a].toFixed(1)
        //     } else {
        //         values[a] = req.body[a]
        //     }
        // }
        // console.log('arr', arr)
        console.log('values', values)
        let result = await sqlQuery('INSERT INTO restaurant_list set ?', values)
        console.log(result)
        res.send({statu: 1, msg: '提交成功'})
    } catch (error) {
        next(error)
    }
})

module.exports = router