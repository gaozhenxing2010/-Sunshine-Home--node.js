//1:加载模块 express pool
const express = require("express");
const pool = require("./pool");
const session=require("express-session");
//2:创建express对象
var app = express();
//2.1:加载跨域访问组件
const cors = require("cors");
//2.2:配置允许脚手架访问程序
app.use(cors({
    origin:["http://127.0.0.1:3001",
    "http://localhost:3001"],
    credentials:true
}));
app.use(session({
  secret:"128位随机字符",
  resave:false,
  saveUninitialized:true,
  cookie:{
    maxAge:1000*60*60*24
  }
}));

//3:指定监听端口3000
app.listen(3000);
//4:指定静态目录 public
// __dirname 当前程序所属目录绝对路径 
//app.js vue_app_server
app.use(express.static(__dirname+"/public"))


//功能一:首页轮播图
app.get("/imagelist",(req,res)=>{
   var obj = [
     {id:1,img_url:"http://127.0.0.1:3000/img/banner1.png"},
     {id:2,img_url:"http://127.0.0.1:3000/img/banner2.png"},
     {id:3,img_url:"http://127.0.0.1:3000/img/banner3.png"},
     {id:4,img_url:"http://127.0.0.1:3000/img/banner4.png"},
     {id:5,img_url:"http://127.0.0.1:3000/img/banner.png"},

   ];
   res.send(obj);
});

//功能二:新闻分页显示
app.get("/newslist",(req,res)=>{
 //1:获取参数
 var pno = req.query.pno;
 var pageSize = req.query.pageSize;
 //2:设置默认值 1 7
 if(!pno){pno = 1}
 if(!pageSize){pageSize=7}
 //3:创建正则表达式验证用户输入验证
 var reg = /^[0-9]{1,3}$/;
 //4:如果错出停止函数运行
 if(!reg.test(pno)){
    res.send({code:-1,msg:"页编格式不正确"});
    return;
 }
 if(!reg.test(pageSize)){
    res.send({code:-2,msg:"页大小格式不正确"});
    return;
 }

 var progress = 0;
 var obj = {code:1};
 //5:创建sql1 查询总记录数   严格区分大小写
 var sql = "SELECT count(id) AS c FROM xz_news";
 pool.query(sql,(err,result)=>{
   if(err)throw err;
   var pageCount = Math.ceil(result[0].c/pageSize);
   progress+=50;
   obj.pageCount = pageCount;
   if(progress==100){
     res.send(obj);
   }
 });
 //6:创建sql2 查询当前页内容 严格区分大小写
 var sql =" SELECT * FROM xz_news LIMIT ?,?";
 var offset = parseInt((pno-1)*pageSize);
 pageSize=parseInt(pageSize)
 pool.query(sql,[offset,pageSize],(err,result)=>{
   if(err)throw err;
   progress+=50;
   obj.data=result;
   if(progress==100){
     res.send(obj);
   }
 })
 //7:返回结果
});  
//功能三：chazhao yitiao xinxi 
app.get("/newsinfo",(req,res)=>{
  //1.参数
  //2.sql语句
  //3.json
  var id=req.query.id;
  var sql="SELECT id,title,content,point,ctime FROM xz_news WHERE id="+id;
  pool.query(sql,(sql,[id],(err,result)=>{ 
    if(err) throw err;
    res.send({code:1,data:result});
    
  }))
});
//功能四:分页查找指定新闻下评论列表
app.get("/getcomment",(req,res)=>{
  //1:获取参数
  var pno = req.query.pno;  //页码
  var pageSize = req.query.pageSize;//页大小
  var nid = req.query.nid; //新闻id
  //2:设置默认值 1 7
  if(!pno){pno = 1}
  if(!pageSize){pageSize=7}
  //3:创建正则表达式验证用户输入验证
  var reg = /^[0-9]{1,3}$/;
  //4:如果错出停止函数运行
  if(!reg.test(pno)){
     res.send({code:-1,msg:"页编格式不正确"});
     return;
  }
  if(!reg.test(pageSize)){
     res.send({code:-2,msg:"页大小格式不正确"});
     return;
  }
 
 
  var progress = 0;
  var obj = {code:1};
  obj.uname = req.session.uname;
  //5:创建sql1 查询总记录数   严格区分大小写
  var sql = "SELECT count(id) AS c FROM xz_comment WHERE nid = ?";
  nid = parseInt(nid);
  pool.query(sql,[nid],(err,result)=>{
    if(err)throw err;
    var pageCount = Math.ceil(result[0].c/pageSize);
    progress+=50;
    obj.pageCount = pageCount;
    if(progress==100){
      res.send(obj);
    }
  });
  //6:创建sql2 查询当前页内容 严格区分大小写
  var sql =" SELECT id,user_name,ctime,";
      sql+=" content";
      sql+=" FROM xz_comment";
      sql+=" WHERE nid = ?";
      sql+=" ORDER BY id DESC"
      sql+=" LIMIT ?,?";
  var offset = parseInt((pno-1)*pageSize);
      pageSize = parseInt(pageSize);
  pool.query(sql,[nid,offset,pageSize],(err,result)=>{
    if(err)throw err;
    progress+=50;
    obj.data=result;
    if(progress==100){
      res.send(obj);
    }
  })
 });

 const bodyParser = require("body-parser");
//true 键值对 id:10 任意数据类型
//false             string/array
app.use(bodyParser.urlencoded({
  extended:false
}));
//功能五:发表评论
app.post("/addComment",(req,res)=>{
  //1:获取3个参数
  //需要第三方模块支持 bodyParser
  var nid = req.body.nid;
  var content = req.body.content;
  var user_name = req.body.user_name;
  //console.log(nid+":"+content+":"+user_name);
  //2:创建sql语句
  var sql  =" INSERT INTO `xz_comment`(`id`,";
      sql +=" `nid`, `user_name`, `ctime`,";
      sql +=" `content`) VALUES";
      sql +=" (null,?,?,now(),?)";
  nid = parseInt(nid);
  pool.query(sql,[nid,user_name,content],(err,result)=>{
       if(err)throw err;
       res.send({code:1,msg:"评论发表成功"});
  });
  //3:返回添加结果
})
//功能六查询商品列表
app.get('/goodsList',(req,res)=>{
  var obj = [];
  obj.push({id:1,title:'小辣椒',old:2999,now:99,img_url:'http://127.0.0.1:3000/img/banner1.png'});
  obj.push({id:2,title:'中辣椒',old:2999,now:99,img_url:'http://127.0.0.1:3000/img/banner2.png'});
  obj.push({id:3,title:'大辣椒',old:2999,now:99,img_url:'http://127.0.0.1:3000/img/banner3.png'});
  res.send(obj)
});



//功能七:用户登录
app.post("/login",(req,res)=>{
  //1:获取参数 uname,upwd
  var uname = req.body.uname;
  var upwd = req.body.upwd;
  //2:创建正则表达式验证
  //3:创建sql
  var sql = "SELECT id";
  sql +=" FROM xz_login";
  sql +=" WHERE uname = ? AND upwd = md5(?)";
  pool.query(sql,[uname,upwd],(err,result)=>{
    if(err)throw err;
    //console.log(result)
    var obj = result[0];
    if(!obj){
      res.send({code:-1,msg:'用户名或密码有误'})
    }else{
      req.session.uname=uname;
      req.session.uid=result[0].id;
      res.send({code:1,msg:'登录成功'}); 
    }
  })
  //4:返回结果
});
app.post("/addCart",(req,res)=>{
  //1:获取3个参数
  //需要第三方模块支持 bodyParser
  //var uid = req.query.uid;
  var pid = req.body.pid;
  var c = req.body.count;
  var uid = req.session.uid;
  //2:创建sql语句
  var sql  =" INSERT INTO `xz_shoppingcart_item`(`iid`, `user_id`, `product_id`, `count`, `is_checked`) VALUES (null,?,?,?,0)"


  pool.query(sql,[uid,pid,c],(err,result)=>{
       if(err)throw err;
       res.send({code:1,msg:"购物车添加成功",uid});
  });
  //3:返回添加结果
});



app.get("/getCarts",(req,res)=>{
  //1:获取参数 uname,upwd
  var uid = req.session.uid;
  //3:创建sql
  var sql =" SELECT c.iid,c.user_id,c.count";
  sql +=" ,p.price,p.lname";
  sql +=" FROM xz_laptop p,";
  sql +=" xz_shoppingcart_item c";
  sql +=" WHERE p.lid = c.product_id";
  sql +=" AND c.user_id = ?";
  uid = parseInt(uid);
  pool.query(sql,[uid],(err,result)=>{
   if(err)throw err;
   res.send({code:1,data:result});
  });
  //4:返回结果
});

//功能十:更新购物数量
app.get("/updateCart",(req,res)=>{
  //1:参数 iid/count
  var iid = req.query.iid;
  var count = req.query.count;
  //2:sql  UPDATE xz_shoppingcart_item
  //       SET count = ? WHERE iid = ? 
  var sql = " UPDATE xz_shoppingcart_item";
  sql += " SET count = ? WHERE iid = ?";
  iid = parseInt(iid);
  count = parseInt(count);
  pool.query(sql,[count,iid],(err,result)=>{
       if(err)throw err;
       if(result.affectedRows > 0){
         res.send({code:1,msg:'修改成功'})
       }else{
        res.send({code:1,msg:'修改失败'})
       }
  })
  //3:json {code:1,msg:"数量修改成功"}
});

//功能十一:搜索商品
app.get("/search",(req,res)=>{
  //如果搜索参数太多
  //var color = req.query.color;
  //var are = req.query.are;
  //var sql = "SELECT ....";
  //if(color != undefined){
  //sql += "AND color="+color;
  //}
  //if(are != undefined){
  //  sql+"AND are = "+color
  //}




  //商品名称关键字
  var keyword = req.query.keyword;
  var low = req.query.low;
  var high = req.query.high;
  var sql = " SELECT lid,lname,price";
  sql +=" FROM xz_laptop";
  sql +=" WHERE lname LIKE ?";
  sql +=" AND price >= ?";
  sql +=" AND price <= ?";
  low = parseFloat(low);
  high = parseFloat(high);
  pool.query(sql,[`%${keyword}%`,low,high],(err,result)=>{
      if(err)throw err;
      if(result.length == 0){
        res.send({code:-1,msg:"您搜索商品不存在噢!"});
      }else{
        res.send({code:1,data:result})
      }
  });
})


 
