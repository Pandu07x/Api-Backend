const mailer=require("nodemailer") 


const transporter= mailer.createTransport({
    service:"gmail",
    auth:{
        user:"tornchadu@gmail.com",
        pass:"ubcc kcyp mkon hruc"
    }
})


const sendMail=async(mail,subject,body)=>{
    var sendmail={
        "from":"tornchadu@gmail.com",
        to:mail,
        subject:subject,
        text:body

    }
    await transporter.sendMail(sendmail)
    return {
        "Status":200,
        "Message":"Sent"

    }
}



module.exports={
    sendMail
}