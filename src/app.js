const express = require('express');
const app = express();
//跨域模块
const cors = require('cors')
const url = require('url')
const restaurantRouter = require('./restaurant.router')
const mysql = require('mysql')
const bodyParser = require('body-parser')
// 使用 createPool 建立连接池
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
//解析表单的插件使用
app.use(bodyParser.json())
// app.use(bodyParser.urlencoded())
app.use(bodyParser.urlencoded({extended: true}))
// user (id,account,password,)
// user_info(id SAMLLINT,account,roles,age,hobby,city,name,avatar,identity)

//错误捕获中间件
function error_handle_middleware(err, req, res, next) {
    if (err) {
        let { message } = err;
        res.status(500).json({
            message:`${message}`
        })
    } else {
        //
    }
}

app.use(cors())
app.use(restaurantRouter)


app.get('/todoList',async (req,res,next)=>{
    //数据
    try {
        let result = await sqlQuery('SELECT * FROM todolist')
    // res.writeHead(200, { "Content-Type": "application/json" });
        let notDone = [], AlreadyDone = [], notPass = []
        for (let i = 0; i < result.length; i++){
            if (result[i].type === '1') {
                notDone.push(result[i])
            } else if (result[i].type === '2') {
                notPass.push(result[i])
            } else {
                AlreadyDone.push(result[i])
            }
        }
        // console.log(result)
    res.send({notDone:notDone,AlreadyDone:AlreadyDone,notPass:notPass})
    } catch (error) {
        next(error)
    }
})
app.get('/todoListADMIN',async (req,res,next)=>{
    //数据
    try {
        let result = await sqlQuery('SELECT * FROM todolistADMIN')
    // res.writeHead(200, { "Content-Type": "application/json" });
        let notDone = [], pass = [], notPass = []
        for (let i = 0; i < result.length; i++){
            if (result[i].type === 'a') {
                notDone.push(result[i])
            } else if (result[i].type === 'b') {
                notPass.push(result[i])
            } else {
                pass.push(result[i])
            }
        }
        // console.log(result)
    res.send({notDone:notDone,pass:pass,notPass:notPass})
    } catch (error) {
        next(error)
    }
    
})
app.post('/todoReject', async (req, res,next) => {
    try {
        if (req.body.method === 'r') {
            let values = ['b',req.body.reason, req.body.eid]
            console.log('values',values)
            let result = await sqlQuery(`UPDATE todolistadmin SET type = ?, reason = ? WHERE eid = ?`, values)
            console.log(req.body, 'result', result)
            if (result) {
                res.send({statu: 1, msg: result})
        }
        } else if (req.body.method === 'p') {
            let values = ['c', req.body.eid]
            let result = await sqlQuery('UPDATE todolistadmin SET type = ? WHERE eid = ?', values)
            if (result) {
                res.send({statu:1,msg: result})
            }
        }
    } catch (error) {
        next(error)
    }
})
app.post('/todoAdd', async (req, res, next) => {
    try {
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
            type: 1
        }
        let result = await sqlQuery('INSERT INTO todolist SET ?', obj)
        res.send({statu:1,msg:result})
    } catch (error) {
        next(error)
    }
})
app.post('/login',function(req,res){
    //数据
    // let a,p
    // let {query} = url.parse(req.url, true)
    let { account, password } = req.body
    console.log('account', req.body)
    async function addToken(values) {
        addResults = await sqlQuery('UPDATE userinfo SET token = ? WHERE account = ?', values)
        // console.log('addrusults', addResults, '传入参数', values)
        // console.log('type addrusults', typeof addResults)
    }
    const adp = [account,password]
    let results,addResults
    async function findUser(values) {
        results = await sqlQuery('SELECT * FROM user WHERE account = ? AND password = ?',values)
        // console.log('用户信息', results)
        if (results.length) {
            var token = new Date().getTime() + account
            // console.log('返回token', token)
            addToken([token,account])
            res.send({statu:1, msg:'登录成功', token: token})
        } else {
            res.send({statu:0, msg: '登录失败'})
        }
    }
    // let addCondition = [token,a]
    findUser(adp)
    // console.log('adp', adp)
    // console.log('addCondition', addCondition)
    // addToken(addCondition)
})
app.get('/getUserInfo', (req, res) => {
    let {query} = url.parse(req.url, true)
    // console.log('获取token', query.token)
    let data
    // for (let a = 0; a < userInfo.length; a++) {
    //     // console.log('进入循环')
    //     if (userInfo[a].token === query.token) {
    //         data = userInfo[a].info
    //         // console.log('获取信息', userInfo[a].info)
    //     }
    // }
    async function searchUserInfo(values) {
        data = await sqlQuery('SELECT * FROM userinfo WHERE token = ?', values)
        // console.log('data', data)
        // console.log('type data', typeof data)
        res.send({statu: 1, msg: '成功', data: data})
    }
    searchUserInfo([query.token])
})
app.post('/sendAvatar', (req, res) => {
    res.send({statu: 1, msg: '上传成功'})
})

app.use(error_handle_middleware)


var server = app.listen(3000,function(){
    console.log('runing 3000...');
})