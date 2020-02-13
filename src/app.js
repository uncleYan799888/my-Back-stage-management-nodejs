const express = require('express');
const app = express();
//跨域模块
const cors = require('cors')
const url = require('url')
const restaurantRouter = require('./restaurant.router')
const todoRouter = require('./todo.router')
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
app.use(todoRouter)


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
    console.log('获取token', query.token)
    let data
    async function searchUserInfo(values) {
        data = await sqlQuery('SELECT * FROM userinfo WHERE token = ?', values)
        console.log('data', data[0].roles)
        let role = data[0].roles
        console.log('type data', typeof data)
        let menus = {
            ADMIN:[
                {
                icon: 'el-icon-s-home',
                index: '/baseHome',
                title: '首页',
                role: 'ADMIN',
                name: 'baseHome',
                children:[]
                },
                {
                icon: 'el-icon-s-home',
                index: 'todolistADMIN',
                title: '待办admin',
                role: 'ADMIN',
                    name: 'todoListADMIN',
                    children:[]
              },{
                icon: 'el-icon-document',
                index: '1',
                title: '深圳餐馆整理',
                role: 'ADMIN',
                children: [
                    {
                        index: '/RestaurantList',
                        title: '餐馆列表',
                        role: 'ADMIN',
                        name: 'RestaurantList'
                    },{
                        index: '/addRestaurant',
                        title: '添加餐馆',
                        role: 'ADMIN',
                        name: 'addRestaurant'
                    },{
                        index: '/StarRestaurant',
                        title: '明星餐馆',
                        role: 'ADMIN',
                        name: 'StarRestaurant'
                    }]
              },{
                icon: 'el-icon-user',
                index: 'personalInfo',
                title: '个人信息',
                role: 'ADMIN',
                    name: 'personalInfo',
                    children:[]
              },{
                icon: 'el-icon-picture-outline-round',
                index: '/Internationalization',
                title: '国际化',
                role: 'ADMIN',
                    name: 'Internationalization',
                    children:[]
              },{
                icon: 'el-icon-picture-outline-round',
                index: '/changePassword',
                title: '修改密码',
                role: 'ADMIN',
                    name: 'changePassword',
                    children:[]
                }],
            TOURIST:[
                {
                icon: 'el-icon-s-home',
                index: '/baseHome',
                title: '首页',
                role: 'TOURIST',
                name: 'baseHome',
                children:[]
                },
                {
                icon: 'el-icon-s-home',
                index: 'todolist',
                title: '待办',
                role: 'TOURIST',
                    name: 'todoList',
                    children:[]
              },{
                icon: 'el-icon-document',
                index: '1',
                title: '深圳餐馆整理',
                role: 'TOURIST',
                children: [
                    {
                        index: '/RestaurantList',
                        title: '餐馆列表',
                        role: 'TOURIST',
                        name: 'RestaurantList'
                    },{
                        index: '/addRestaurant',
                        title: '添加餐馆',
                        role: 'TOURIST',
                        name: 'addRestaurant'
                    },{
                        index: '/StarRestaurant',
                        title: '明星餐馆',
                        role: 'TOURIST',
                        name: 'StarRestaurant'
                    }]
              },{
                icon: 'el-icon-user',
                index: 'personalInfo',
                title: '个人信息',
                role: 'TOURIST',
                    name: 'personalInfo',
                    children:[]
              },{
                icon: 'el-icon-picture-outline-round',
                index: '/Internationalization',
                title: '国际化',
                role: 'TOURIST',
                    name: 'Internationalization',
                    children:[]
              },{
                icon: 'el-icon-picture-outline-round',
                index: '/changePassword',
                title: '修改密码',
                role: 'TOURIST',
                    name: 'changePassword',
                    children:[]
                }]
        }
        res.send({statu: 1, msg: '成功', data: data,menu:menus[role]})
    }
    searchUserInfo([query.token])
})
app.get('/getRouter', async (req, res, next) => {
    try {
        res.send({statu:1,msg:'成功'})
    } catch (err) {
        next(err)
    }
})
app.post('/sendAvatar', (req, res) => {
    res.send({statu: 1, msg: '上传成功'})
})

app.use(error_handle_middleware)


var server = app.listen(3000,function(){
    console.log('runing 3000...');
})