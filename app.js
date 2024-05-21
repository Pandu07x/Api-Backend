const express=require('express')
const app=express()
const sessions=require("express-session")
const mongodb=require("mongodb")
const mail=require("./components/mail")
const cors=require("cors")
const body=require("body-parser")
var  { createClient } =require('redis');
var mongosanitize=require("express-mongo-sanitize")
var {uuid}=require("uuidv4")

// const clientredis = createClient({
//     password: 'hg2Q6d7uNDFhcZBN56jBx6fUs6JzdWbR',
//     socket: {
//         host: 'redis-10150.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
//         port: 10150
//     }
// });

const client=new mongodb.MongoClient('mongodb+srv://root:1234@cluster0.jqozagk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
app.use(cors())
app.use(body.json())
app.use(body.urlencoded({extended:true}))
 app.use(mongosanitize())

 const checkKey=async(req,res,next)=>{

    try{
        console.log(req.path)
      if(req.path!="/login"){
        console.log(req.path!="/login")
        const key=req.body.Auth
        
        if(key==undefined){
            res.status(401).json({
                "Message":"UnAuthorized",
                status:401
            })
            return ""
        }
            
            // await clientredis.connect()
            // //await  clientredis.quit()
            // const getdata=await clientredis.get(key)
            // await clientredis.disconnect()
            // const data=JSON.parse(getdata)

           // console.log(data)
           const data=await client.db("Api-Testing").collection("Session").find({"session":key}).toArray()
           console.log(data)
            if(data.length<=0){
                res.status(401).json({
                    "Message":"UnAuthorized",
                    status:401
                })
                return ""
            }
            
            if(new Date(+36)>=data[0].details.Date){
                await client.db("Api-Testing").collection("Session").deleteOne({"session":key})
                res.status(410).json({
                    "Message":"Your Session Expired!. Please Login Again",
                    status:410
                })
            }
            else{
                next()
            }
      }
      else{
        next()
      }
        
       

    }
    catch(err){
        console.log(err)
        res.status(500).json({
            "Message":"Internal Server Error"
        })
    }

 }
app.use(checkKey)




app.post("/signup",async(req,res)=>{
    try{
        //console.log(req)
        const name=req.body.name
        const email=req.body.email
        const phone =req.body.phone
        const pass=req.body.pass
       
      
        const random=Math.floor(Math.random()*100000)
        req.session.signup={
            Name:name,
            Email:email,
            Phone:phone,
            Password:pass,
            otp:random
        }
        console.log(random,"otp")
        const existEmail=await client.db("Api-Testing").collection("userinfo").find({Email:email})
        const check=await existEmail.toArray()
        if (check.length>0){
            res.status(401).json({
                Message:"User Already Exist",
                status:401
            })
        }
       else{
        const insert=await client.db("Api-Testing").collection("Temp").insertOne({
            Name:name,
            Email:email,
            Phone:phone,
            Password:pass,
            otp:random
        })
        const message=`Your Otp is ${random}`
        const subject=`OTP for verification`
        const data=await mail.sendMail(email,subject,message)
        res.status(200).json({
            "Message":"Ok",
            "Status":"200"
        })
       }




    }
    catch(err){
        console.log(err)
        res.status(500).json({
            "Message":"Internal Server Error"
        })
    }
})
app.post("/test",(req,res)=>{
    res.send("hello world")
})

app.post("/login_otp",async(req,res)=>{
    try{
        const random=Math.floor(Math.random()*100000)
        const user_otp=req.body.otp
        console.log(req.body)
        //const data=req.session.signup
const datas=await client.db("Api-Testing").collection("Temp").find()
const data2=await datas.toArray()
const data=data2[0]
console.log(data)
        console.log(req.session)
        if (data.otp==user_otp){
            const insert=await client.db("Api-Testing").collection("userinfo").insertOne({
                Name:data.Name,
                Email:data.Email,
                Phone:data.Phone,
                Password:data.Password
            })
            const deletes=await client.db("Api-Testing").collection("Temp").deleteOne({otp:data.otp})
            
        res.status(200).json({
            "Message":"Inserted Successfully",
            "Status":"200"
        })
        }
        else{
            res.status(401).json("Invaild OTP TryAgain Later")
        }

    }
    catch(err){
        console.log(err)
        res.status(500).json({
            "Message":"Internal Server Error"
        })
    }
})
app.post("/login",async(req,res)=>{
    try{
        console.log("called")

       const name=req.body.user
       const password=req.body.pass
       console.log({Email:name,Password:password})

       const find=await client.db("Api-Testing").collection("userinfo").find({Email:name,Password:password})
       const result=await find.toArray()
       const ses=uuid()
       if(result.length==0){
        res.status(401).json({
            "Message":"Not Found",
            status:401
           })
           return ""
       }
       console.log(result)
       const str={
        "Date":new Date(),
        Email:result[0].Email
       }
       
       const test={
        "session":ses,
        "details":str
       }
       const normalstring=`${ses}:${JSON.stringify(str)}`
       console.log(normalstring)
    //    const newjson=JSON.parse(normalstring)
       await client.db("Api-Testing").collection("Session").insertOne(test)
    //    await clientredis.connect()
    //    await clientredis.set(ses,JSON.stringify(str))
    //    await clientredis.disconnect()
       res.status(200).json({
        "Message":"Found",
        "Name":result[0].Name,
        "NeeKasu":ses,
        status:200
       })



    }
    catch(err){
        console.log(err)
        res.status(500).json({Message:"Internal Error"})
    }
})

app.post("/Test",async(req,res)=>{
    try{
        const data=req.body.data
      //  await clientredis.connect()
        const getData=await clientredis.get(data)
        await clientredis.disconnect()
        res.json(getData)
        
    }
    catch(err){
        console.log(err)
        res.status(500).json({Message:"Internal Error"})
    }
})

app.post("/CreateProject",async(req,res)=>{
    try{
        const name=req.body.name
        const purpose=req.body.purpose

        const token=req.body.Auth
        //await clientredis.connect()
        var data=await clientredis.get(token)
        data=JSON.parse(data)
        console.log(data["Email"])
        await clientredis.disconnect()
        const existname=await client.db("Api-Testing").collection("Projects").find({Name:name.toLowerCase(),Email:data["Email"]}).toArray()
        if (existname.length>0){
            res.status(401).json({
                "Message":`${name} Project Already Exist in your Account`,
                "Status":401
            })
        }
        else{
            const insertdata={
                "Name":name.toLowerCase(),
                "Email":data["Email"],
                "Date":new Date(),
                "Purpose":purpose,
                "Api-Key":""
            }
            //Hello world
            const insertquery=await client.db("Api-Testing").collection("Projects").insertOne(insertdata)
            res.status(200).json({
                "Message":"Inserted Successfully",
                "Status":200
            })
        }



    }
    catch(err){
        console.log(err)
        res.status(500).json("Internal Error")
    }

})
app.post("/getProjects",async(req,res)=>{
    try{
        const authkey=req.body.Auth
       // await clientredis.connect()
        var data=await client.db("Api-Testing").collection("Session").find({"session":authkey}).toArray()
        const mail=data[0].details.Email
        // data=JSON.parse(data)
        // await clientredis.disconnect()

        const getProjects=await client.db("Api-Testing").collection("Projects").find().toArray({"Email":mail})

        if(getProjects.length<=0){
            res.status(204).json({
                "Message":"No Content Available"
            })
            return ""
        }
        res.status(200).json(getProjects)
        


    }
    catch(err){
        console.log(err)
        res.status(500).json({Message:"Internal Error"})
    }
})



app.listen(8000,'192.168.1.203',()=>{
    console.log("Server Started")
})






