const crypto=require("crypto")


const encrypt=(txt)=>{
    try{
        const iv=crypto.randomBytes(16)
        console.log(iv)
        const key="Hello world"
        const cipher=crypto.createCipheriv('aes-256')

    }
    catch(err){
        return err
    }

}