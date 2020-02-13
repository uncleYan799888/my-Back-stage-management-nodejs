const express = require('express')
const router = express.Router()
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

//执行者事项列表
router.get('/todoList',async (req,res,next)=>{
  //数据
  try {
      let result = await sqlQuery('SELECT * FROM todolist')
  // res.writeHead(200, { "Content-Type": "application/json" });
      let notDone = [], AlreadyDone = [], notPass = []
      for (let i = 0; i < result.length; i++){
          if (result[i].type === 'a' || result[i].type === 'c') {
              notDone.push(result[i])
          } else if (result[i].type === 'b') {
              notPass.push(result[i])
          } else if(result[i].type === 'd'){
              AlreadyDone.push(result[i])
          }
      }
      // console.log(result)
  res.send({notDone:notDone,AlreadyDone:AlreadyDone,notPass:notPass})
  } catch (error) {
      next(error)
  }
})
//管理员事项列表
router.get('/todoListADMIN',async (req,res,next)=>{
  //数据
  try {
      let result = await sqlQuery('SELECT * FROM todolist')
  // res.writeHead(200, { "Content-Type": "application/json" });
      let notDone = [], pass = [], notPass = [],ExecutorTodo= []
      for (let i = 0; i < result.length; i++){
          if (result[i].type === 'b') {
              notDone.push(result[i])
          } else if (result[i].type === 'c') {
              notPass.push(result[i])
          } else if(result[i].type === 'd') {
              pass.push(result[i])
          } else if (result[i].type === 'a') {
            ExecutorTodo.push(result[i])
          }
      }
      // console.log(result)
  res.send({notDone:notDone,pass:pass,notPass:notPass,ExecutorTodo:ExecutorTodo})
  } catch (error) {
      next(error)
  }
  
})
//管理员驳回
router.post('/todoReject', async (req, res, next) => {
  //管理员表改变，执行者表也改变
    try {
        if (req.body.method === 'r') {
          //reject
        let values = ['c',req.body.reason, req.body.eid]
        console.log('values',values)
        //   let todolistadmin = await sqlQuery(`UPDATE todolistadmin SET type = ?, reason = ? WHERE eid = ?`, values)
        let todolist = await sqlQuery(`UPDATE todolist SET type = ?, reason = ? WHERE eid = ?`, values)
        //   console.log(req.body, 'result', result)
        if (todolist) {
            res.send({statu: 1, msg: '操作成功'})
        }
    } else if (req.body.method === 'p') {
          //pass
            let date = new Date()
        let year = date.getFullYear();
        let month = date.getMonth() + 1;
        let strDate = date.getDate()
        if(month >=1 && month <= 9){
            month = '0' + month
        }
        if(strDate >=1 && strDate<=9){
            strDate = '0' + strDate
        }
            let event_time = year + '-' + month + '-' + strDate
            let values = ['d', event_time,req.body.eid]
        //   let updataADMIN = await sqlQuery('UPDATE todolistadmin SET type = ? WHERE eid = ?', values)
        let updata = await sqlQuery('UPDATE todolist SET type = ?, end_time = ? WHERE eid = ?', values)
        if (updata) {
            res.send({statu:1,msg: '操作成功'})
        }
    }
} catch (error) {
    next(error)
}
})
//管理员添加事项给执行者
router.post('/todoAdd', async (req, res, next) => {
  try {
    //通过uid获取执行者名字账号
      console.log(req.body)
      let name = await sqlQuery(`SELECT name,account from userinfo where uid = ${req.body.uid}`)
      console.log('name', name)
      //获取当前日期
      let date = new Date()
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      let strDate = date.getDate()
      if(month >=1 && month <= 9){
          month = '0' + month
      }
      if(strDate >=1 && strDate<=9){
          strDate = '0' + strDate
      }
      let event_time = year + '-' + month + '-' + strDate
      let obj = {
          personnel_account: name[0].account,
          personnel_name: name[0].name,
          event_detailed: req.body.event_detailed,
          event_time: event_time,
          type: 'a'
      }
      let result = await sqlQuery('INSERT INTO todolist SET ?', obj)
      res.send({statu:1,msg:result})
  } catch (error) {
      next(error)
  }
})
//执行者提交事项
router.post('/todoSubmission', async (req, res, next) => {
    try {
      //参数有eid
      console.log('data', req.body)
      let updateType = await sqlQuery(`UPDATE todolist SET type = 'b' WHERE eid = ${req.body.eid}`)
      console.log('result', updateType)
    //   let getEventALL = await sqlQuery(`SELECT * FROM todolist WHERE eid = ${req.body.eid}`)
    //   console.log('getEventALL', getEventALL)
    //   let obj = {
    //       personnel_account: getEventALL[0].personnel_account,
    //       event_detailed: getEventALL[0].event_detailed,
    //       event_time: getEventALL[0].event_time,
    //       personnel_name: getEventALL[0].personnel_name,
    //       type: 'a'
    //   }
    //   let addToAdmin = await sqlQuery('INSERT INTO todolistadmin SET ?', obj)
    //   console.log('addToAdmin', addToAdmin)
      if (updateType) {
          res.send({statu:1,msg:'成功'})
      }
  } catch (error) {
      next(error)
  }
})


module.exports = router